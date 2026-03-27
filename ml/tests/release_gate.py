"""Production-grade ML release gate.

Runs deterministic multi-pass integration checks and validates graph count stability.
"""

import argparse
import asyncio
import json
import logging
import os
from datetime import datetime
from datetime import UTC
from pathlib import Path
from typing import Any

from ml.graph import close_neo4j, init_neo4j
from ml.tests.test_integration import run_integration_test


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def _fetch_graph_totals(neo4j_uri: str, neo4j_user: str, neo4j_password: str) -> dict[str, int]:
    """Read key graph totals after each cycle for idempotency checks."""
    client = init_neo4j(neo4j_uri, neo4j_user, neo4j_password)
    try:
        fragrance_count = client.execute_query("MATCH (f:Fragrance) RETURN COUNT(f) AS count")[0]["count"]
        note_count = client.execute_query("MATCH (n:Note) RETURN COUNT(n) AS count")[0]["count"]
        accord_count = client.execute_query("MATCH (a:Accord) RETURN COUNT(a) AS count")[0]["count"]
        brand_count = client.execute_query("MATCH (b:Brand) RETURN COUNT(b) AS count")[0]["count"]
        relationship_count = client.execute_query("MATCH ()-[r]->() RETURN COUNT(r) AS count")[0]["count"]
        return {
            "fragrance_count": fragrance_count,
            "note_count": note_count,
            "accord_count": accord_count,
            "brand_count": brand_count,
            "relationship_count": relationship_count,
        }
    finally:
        close_neo4j()


def _write_gate_artifact(report: dict[str, Any], artifact_dir: Path) -> Path:
    artifact_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    output_path = artifact_dir / f"release_gate_{timestamp}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    return output_path


async def run_release_gate(
    neo4j_uri: str,
    neo4j_user: str,
    neo4j_password: str,
    profile: str,
    strict: bool,
    cycles: int,
    artifact_dir: Path,
) -> dict[str, Any]:
    """Run multi-cycle integration checks and enforce deterministic graph totals."""
    started_at = datetime.now(UTC)
    cycle_reports: list[dict[str, Any]] = []

    for cycle in range(1, cycles + 1):
        cleanup = cycle == 1
        logger.info(
            "Running release gate cycle %s/%s (cleanup=%s, profile=%s, strict=%s)",
            cycle,
            cycles,
            cleanup,
            profile,
            strict,
        )

        result = await run_integration_test(
            neo4j_uri=neo4j_uri,
            neo4j_user=neo4j_user,
            neo4j_password=neo4j_password,
            cleanup=cleanup,
            profile=profile,
            strict=strict,
            artifact_dir=artifact_dir,
        )
        totals = _fetch_graph_totals(neo4j_uri, neo4j_user, neo4j_password)

        cycle_reports.append(
            {
                "cycle": cycle,
                "cleanup": cleanup,
                "integration_status": result.get("overall_status"),
                "strict_mode": result.get("strict_mode"),
                "validation_summary": result.get("phases", {}).get("validate", {}).get("summary", {}),
                "graph_totals": totals,
                "integration_artifact": result.get("artifact_path"),
            }
        )

    deterministic = True
    if len(cycle_reports) >= 3:
        baseline = cycle_reports[1]["graph_totals"]
        for report in cycle_reports[2:]:
            if report["graph_totals"] != baseline:
                deterministic = False
                break

    all_passed = all(r["integration_status"] == "passed" for r in cycle_reports)

    completed_at = datetime.now(UTC)
    release_report = {
        "started_at_utc": started_at.isoformat() + "Z",
        "completed_at_utc": completed_at.isoformat() + "Z",
        "duration_seconds": round((completed_at - started_at).total_seconds(), 3),
        "profile": profile,
        "strict": strict,
        "cycles": cycles,
        "all_passed": all_passed,
        "deterministic_totals": deterministic,
        "status": "passed" if (all_passed and deterministic) else "failed",
        "cycle_reports": cycle_reports,
    }

    artifact_path = _write_gate_artifact(release_report, artifact_dir)
    release_report["artifact_path"] = str(artifact_path)
    return release_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Run ML production release gate checks.")
    parser.add_argument(
        "neo4j_uri",
        nargs="?",
        default=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
    )
    parser.add_argument(
        "neo4j_user",
        nargs="?",
        default=os.getenv("NEO4J_USERNAME", os.getenv("NEO4J_USER", "neo4j")),
    )
    parser.add_argument(
        "neo4j_password",
        nargs="?",
        default=os.getenv("NEO4J_PASSWORD", "password"),
    )
    parser.add_argument(
        "--profile",
        default=os.getenv("SCENTSCAPE_VALIDATION_PROFILE", "production"),
        choices=["local", "staging", "production"],
    )
    parser.add_argument("--strict", dest="strict", action="store_true")
    parser.add_argument("--no-strict", dest="strict", action="store_false")
    parser.set_defaults(strict=True)
    parser.add_argument("--cycles", type=int, default=3)
    parser.add_argument(
        "--artifact-dir",
        default=os.getenv("SCENTSCAPE_VALIDATION_ARTIFACT_DIR", ""),
    )
    args = parser.parse_args()

    artifact_dir = Path(args.artifact_dir) if args.artifact_dir else (Path(__file__).parent.parent / "logs" / "release_gate")

    report = asyncio.run(
        run_release_gate(
            neo4j_uri=args.neo4j_uri,
            neo4j_user=args.neo4j_user,
            neo4j_password=args.neo4j_password,
            profile=args.profile,
            strict=args.strict,
            cycles=args.cycles,
            artifact_dir=artifact_dir,
        )
    )

    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
