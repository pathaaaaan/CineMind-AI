import ast
import json


def parse_name_list(value: object, limit: int | None = None) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        items = value
    else:
        text = str(value).strip()
        if not text:
            return []
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            try:
                parsed = ast.literal_eval(text)
            except (ValueError, SyntaxError):
                return [part for part in text.split(" ") if part][:limit]
        items = parsed
    names = []
    for item in items:
        if isinstance(item, dict) and item.get("name"):
            names.append(str(item["name"]))
        elif isinstance(item, str):
            names.append(item)
    return names[:limit] if limit else names


def split_words(value: object) -> list[str]:
    if value is None:
        return []
    return [part for part in str(value).split(" ") if part]

