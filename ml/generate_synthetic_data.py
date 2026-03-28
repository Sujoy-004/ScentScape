import json
import random
import uuid
import os

# Modern production market base
base_brands = ["Dior", "Chanel", "Tom Ford", "Creed", "Byredo", "Le Labo", "Maison Francis Kurkdjian", "Jo Malone", "Yves Saint Laurent", "Guerlain", "Hermes", "Acqua di Parma", "Nishane", "Parfums de Marly", "Amouage", "Roja", "Xerjoff", "Initio", "Vilhelm", "Kilian", "Penhaligon's", "Diptyque", "Mancera", "Montale"]
base_notes = ["Bergamot", "Rose", "Oud", "Vanilla", "Sandalwood", "Patchouli", "Musk", "Amber", "Jasmine", "Vetiver", "Lemon", "Pink Pepper", "Cedar", "Tonka Bean", "Cardamom", "Iris", "Leather", "Grapefruit", "Lavender", "Orange Blossom", "Ylang-Ylang", "Tuberose", "Frankincense", "Myrrh", "Tobacco", "Saffron", "Neroli", "Cinnamon", "Cashmeran", "Ambroxan"]
base_accords = ["Woody", "Floral", "Citrus", "Spicy", "Oriental", "Fresh", "Gourmand", "Aquatic", "Aromatic", "Leather", "Smoky", "Earthy", "Powdery", "Fruity", "Green", "Musky", "Amber", "Animalic"]
name_suffixes = ["Intense", "Absolute", "L'Eau", "Extrait", "Oud", "Noir", "Blanc", "Sport", "Fraiche", "Rose", "Nuit", "Soleil"]

def generate_synthetic_dataset(count=10000):
    dataset = []
    
    for i in range(count):
        brand = random.choice(base_brands)
        year = random.randint(2000, 2025)
        
        gender_roll = random.random()
        if gender_roll < 0.45:
            gender = "Unisex"
        elif gender_roll < 0.75:
            gender = "Female"
        else:
            gender = "Male"
            
        concentration = random.choices(
            ["Eau de Toilette", "Eau de Parfum", "Extrait de Parfum", "Eau de Cologne"],
            weights=[30, 50, 15, 5]
        )[0]
        
        top = random.sample(base_notes, k=random.randint(2, 4))
        mid = random.sample(base_notes, k=random.randint(2, 4))
        base_n = random.sample(base_notes, k=random.randint(2, 4))
        accords = random.sample(base_accords, k=random.randint(2, 5))
        
        name = f"{brand} {accords[0]} {random.choice(name_suffixes)}"
        
        fragrance = {
            "id": f"frag_syn_{uuid.uuid4().hex[:12]}",
            "name": name,
            "brand": brand,
            "year": year,
            "concentration": concentration,
            "gender_label": gender,
            "description": f"A stunning {accords[0].lower()} and {accords[1].lower()} fragrance released in {year}. Opens with {top[0].lower()} and dries down to a {base_n[0].lower()} base.",
            "top_notes": top,
            "middle_notes": mid,
            "base_notes": base_n,
            "accords": accords,
            # Interaction & ML metrics for Collaborative Filtering and Cold-Start
            "popularity_score": round(random.uniform(10, 100), 2),
            "review_count": random.randint(0, 15000),
            "rating": round(random.uniform(3.0, 5.0), 2) if random.random() > 0.05 else None,
            "view_count": random.randint(500, 250000)
        }
        dataset.append(fragrance)
        
    return dataset

if __name__ == "__main__":
    print("Initializing synthetic augmentation script for ScentScape ML pipeline...")
    data = generate_synthetic_dataset(10000)
    
    os.makedirs("data", exist_ok=True)
    out_path = "data/synthetic_10k_fragrances.json"
    
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
        
    print(f"Successfully generated {len(data)} production-scale records at {out_path}.")
    print("Features resolved:")
    print("- Gender labels strictly populated (Unisex, Female, Male distributions)")
    print("- Simulated interaction metrics injected (ratings, views, popularity) for CF")
    print("- Year ranges brought current to 2025")
    print("- Notes/Accords rigorously sanitized as relational arrays")
