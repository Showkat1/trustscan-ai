from __future__ import annotations

from fastapi.testclient import TestClient


def test_knowledge_documents_are_seeded(client: TestClient, auth: dict[str, str]) -> None:
    response = client.get("/api/v1/knowledge", headers=auth)
    assert response.status_code == 200
    documents = response.json()
    assert len(documents) >= 4
    assert all(document["chunk_count"] >= 1 for document in documents)


def test_knowledge_semantic_search(client: TestClient, auth: dict[str, str]) -> None:
    response = client.get(
        "/api/v1/knowledge/search",
        headers=auth,
        params={"q": "bank OTP phishing link", "top_k": 3},
    )
    assert response.status_code == 200
    hits = response.json()["hits"]
    assert hits
    assert hits[0]["score"] > 0
    assert hits[0]["text"]


def test_knowledge_document_detail(client: TestClient, auth: dict[str, str]) -> None:
    documents = client.get("/api/v1/knowledge", headers=auth).json()
    document_id = documents[0]["id"]
    response = client.get(f"/api/v1/knowledge/{document_id}", headers=auth)
    assert response.status_code == 200
    payload = response.json()
    assert payload["content"]
    assert payload["chunks"]
    assert payload["chunks"][0]["content"]


def test_knowledge_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/knowledge").status_code == 401
