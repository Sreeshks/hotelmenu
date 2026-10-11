import pypdf

pdf_path = r"C:\Users\Sreesh K Suresh\Downloads\Koottu Curry Restaurant,menu.pdf"
reader = pypdf.PdfReader(pdf_path)
print(f"Total pages: {len(reader.pages)}")

all_text = []
for i, page in enumerate(reader.pages):
    text = page.extract_text() or ""
    print(f"--- Page {i + 1} ({len(text)} chars) ---")
    print(text[:400])
    all_text.append(f"=== PAGE {i+1} ===\n" + text)

with open("extracted_menu_raw.txt", "w", encoding="utf-8") as f:
    f.write("\n\n".join(all_text))

print("Full text saved to extracted_menu_raw.txt")
