# เจนรูปไดโนใส่หมวกซานต้าในแอป Gemini

## ขั้นตอน (ทำทีละรูป)

1. แนบรูปเดิมของไดโนจาก `src/assets/dino/` (ดูรายชื่อด้านล่าง)
2. วาง prompt นี้:

```
Put a cute plush red Santa Claus hat with a fluffy white fur brim and a white pom-pom on this dinosaur's head, worn naturally and fitting the shape of its head.
Keep the dinosaur EXACTLY the same: same pose, same size, same position in the frame, same colors, same face and expression, same lighting and 3D style. Do not crop it and do not change anything except adding the hat.
Background: one flat solid pure bright green color (#00FF00) filling the entire image — no shadow, no floor, no other objects, no text.
```

3. บันทึกรูปที่ได้ไว้ที่ `scripts/.outfit-raw/dino/` ตั้งชื่อตามคอลัมน์ "บันทึกเป็น"
4. เจนครบแล้ว (หรือทำไปบางส่วนก็ได้) บอก Claude หรือรันเอง: `node scripts/dino-dress.mjs`
   สคริปต์จะลบพื้นเขียวและปรับขนาดให้ตัวไดโนทับรูปเดิมพอดี ไดโนในแอปจะตัวเท่าเดิม ยืนที่เดิม แค่มีหมวก

ตัวไหน/วัยไหนยังไม่มีรูป ในตู้เสื้อผ้าจะขึ้นว่า "กำลังจะมาเร็วๆ นี้" และตัวไดโนจะยังไม่สวมหมวก

## รายชื่อรูป (12 พันธุ์ × 3 วัย = 36 รูป)

| พันธุ์ | วัยเด็ก | วัยรุ่น | โตเต็มวัย (ใช้ในสวนด้วย) |
|---|---|---|---|
| ทีเร็กซ์ | `trex-baby.webp` → `trex-baby--hat-santa.png` | `trex-teen.webp` → `trex-teen--hat-santa.png` | `trex-adult.webp` → `trex-adult--hat-santa.png` |
| สไตราโคซอรัส | `styra-baby.webp` → `styra-baby--hat-santa.png` | `styra-teen.webp` → `styra-teen--hat-santa.png` | `styra-adult.webp` → `styra-adult--hat-santa.png` |
| แพคีเซฟาโลซอรัส | `pachy-baby.webp` → `pachy-baby--hat-santa.png` | `pachy-teen.webp` → `pachy-teen--hat-santa.png` | `pachy-adult.webp` → `pachy-adult--hat-santa.png` |
| แกลลิไมมัส | `galli-baby.webp` → `galli-baby--hat-santa.png` | `galli-teen.webp` → `galli-teen--hat-santa.png` | `galli-adult.webp` → `galli-adult--hat-santa.png` |
| ดิปโพลโดคัส | `diplo-baby.webp` → `diplo-baby--hat-santa.png` | `diplo-teen.webp` → `diplo-teen--hat-santa.png` | `diplo-adult.webp` → `diplo-adult--hat-santa.png` |
| เอลาสโมซอรัส | `elas-baby.webp` → `elas-baby--hat-santa.png` | `elas-teen.webp` → `elas-teen--hat-santa.png` | `elas-adult.webp` → `elas-adult--hat-santa.png` |
| เทอโรซอร์ | `ptero-baby.webp` → `ptero-baby--hat-santa.png` | `ptero-teen.webp` → `ptero-teen--hat-santa.png` | `ptero-adult.webp` → `ptero-adult--hat-santa.png` |
| ไดเมโทรดอน | `flame-baby.webp` → `flame-baby--hat-santa.png` | `flame-teen.webp` → `flame-teen--hat-santa.png` | `flame-adult.webp` → `flame-adult--hat-santa.png` |
| พาราซอโรโลฟัสกาแล็กซี | `galaxy-baby.webp` → `galaxy-baby--hat-santa.png` | `galaxy-teen.webp` → `galaxy-teen--hat-santa.png` | `galaxy-adult.webp` → `galaxy-adult--hat-santa.png` |
| เทอโรซอร์ฟีนิกซ์ | `phoenix-baby.webp` → `phoenix-baby--hat-santa.png` | `phoenix-teen.webp` → `phoenix-teen--hat-santa.png` | `phoenix-adult.webp` → `phoenix-adult--hat-santa.png` |
| ไดโนคริสตัล | `crystal-baby.webp` → `crystal-baby--hat-santa.png` | `crystal-teen.webp` → `crystal-teen--hat-santa.png` | `crystal-adult.webp` → `crystal-adult--hat-santa.png` |
| แองคิโลซอรัสลาวา | `lava-baby.webp` → `lava-baby--hat-santa.png` | `lava-teen.webp` → `lava-teen--hat-santa.png` | `lava-adult.webp` → `lava-adult--hat-santa.png` |

## (ไม่บังคับ) ท่าอื่นของตัวโต

ถ้าไม่เจน ตอนไดโนดีใจ/กิน/ป่วย/วิ่ง จะใช้รูปยืนใส่หมวกแทน และตอนนอนจะถอดหมวก
ถ้าอยากให้ทุกท่าใส่หมวกด้วย เจนเพิ่มได้ เช่น `trex-happy.webp` → `trex-happy--hat-santa.png` (ท่า: happy, eat, sick, sleep, run)
