
import pytest

from app.hashing import calculate_sha256


def test_same_content_produces_same_hash():
    content = b"Student marks: 85"
    assert calculate_sha256(content) == calculate_sha256(content)


def test_changed_content_produces_different_hash():
    original = b"Student marks: 85"
    modified = b"Student marks: 95"

    assert calculate_sha256(original) != calculate_sha256(modified)


def test_hash_is_64_hex_characters():
    result = calculate_sha256(b"Academic record")

    assert len(result) == 64
    assert all(char in "0123456789abcdef" for char in result)


def test_non_bytes_input_is_rejected():
    with pytest.raises(TypeError):
        calculate_sha256("Academic record")
