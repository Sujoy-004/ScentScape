import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Any

import torch
from torch_geometric.data import Data
from torch_geometric.nn import SAGEConv
import torch.nn.functional as F
from pinecone import Pinecone, ServerlessSpec

logger = logging.getLogger(__name__)

class GraphSAGEModel(torch.nn.Module):
    def __init__(self, in_channels: int, hidden_channels: int = 128, out_channels: int = 128):
        super(GraphSAGEModel, self).__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, out_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.5, training=self.training)
        x = self.conv2(x, edge_index)
        return x

class GraphEmbedder:
    def __init__(self, dim: int = 128):
        self.dim = dim
        pinecone_api_key = os.environ.get("PINECONE_API_KEY")
        if pinecone_api_key and pinecone_api_key != "your_pinecone_api_key_here":
            self.pc = Pinecone(api_key=pinecone_api_key)
            self.index_name = "scentscape-graph"
            self._ensure_index()
        else:
            logger.warning("Pinecone API key not configured. Graph embeddings will not be uploaded.")
            self.pc = None

    def _ensure_index(self):
        """Ensure the Pinecone index exists, create if it doesn't."""
        existing_indexes = [index_info["name"] for index_info in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            logger.info(f"Creating Pinecone index: {self.index_name}")
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dim,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        self.index = self.pc.Index(self.index_name)

    def _build_graph(self, fragrances: List[Dict[str, Any]]) -> Data:
        """Build PyTorch Geometric graph data from seed JSON."""
        # This is a mock simplified graph building process since Neo4j might not be populated in dev setup
        node_features = []
        node_mapping = {}
        edge_index = [[], []]
        
        # 1. Create nodes and simple features
        for i, frag in enumerate(fragrances):
            node_mapping[frag["id"]] = i
            # Dummy feature vector (e.g. 10 dimensions)
            node_features.append(torch.rand(10)) 
            
        # 2. Build edges based on shared notes (Naive approach for offline generation)
        notes_to_frags = {}
        for frag in fragrances:
            all_notes = frag.get("top_notes", []) + frag.get("middle_notes", []) + frag.get("base_notes", [])
            for note in set(all_notes):
                if note not in notes_to_frags:
                    notes_to_frags[note] = []
                notes_to_frags[note].append(frag["id"])
                
        for note, frag_ids in notes_to_frags.items():
            for i in range(len(frag_ids)):
                for j in range(i + 1, len(frag_ids)):
                    n1 = node_mapping[frag_ids[i]]
                    n2 = node_mapping[frag_ids[j]]
                    edge_index[0].extend([n1, n2])
                    edge_index[1].extend([n2, n1])
                    
        x = torch.stack(node_features)
        edge_index = torch.tensor(edge_index, dtype=torch.long)
        
        return Data(x=x, edge_index=edge_index), node_mapping

    def generate_and_upload(self, fragrances: List[Dict[str, Any]]):
        """Train GraphSAGE and upload the node embeddings."""
        if not fragrances:
            logger.error("No fragrances provided for GraphSAGE generation.")
            return
            
        data, node_mapping = self._build_graph(fragrances)
        
        # 10 input dims because we initialized random 10-dim features for nodes
        model = GraphSAGEModel(in_channels=10, hidden_channels=64, out_channels=self.dim)
        model.eval()
        
        with torch.no_grad():
            out_embeddings = model(data.x, data.edge_index)
            
        if not self.pc:
            logger.info("Graph embeddings generated successfully. Skipping Pinecone upload.")
            return
            
        vectors_to_upsert = []
        for frag in fragrances:
            n_idx = node_mapping[frag["id"]]
            emb = out_embeddings[n_idx].tolist()
            
            clean_meta = {
                "name": str(frag.get("name", "")),
                "brand": str(frag.get("brand", ""))
            }
            vectors_to_upsert.append({
                "id": frag["id"],
                "values": emb,
                "metadata": clean_meta
            })
            
        logger.info(f"Upserting {len(vectors_to_upsert)} GraphSAGE embeddings to Pinecone...")
        # Batch upsert
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            self.index.upsert(vectors=batch)
        logger.info("GraphSAGE embeddings uploaded.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_path = Path(__file__).parent.parent / "data" / "seed_fragrances.json"
    if seed_path.exists():
        with open(seed_path, "r", encoding="utf-8") as f:
            fragrances = json.load(f)
        
        embedder = GraphEmbedder()
        embedder.generate_and_upload(fragrances)
    else:
        logger.error("Seed fragrances data not found.")
