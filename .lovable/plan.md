# TOPTIERclub — complete workspace redesign

## เป้าหมายและแนวทาง
ปรับเป็นพื้นที่ติดตามตลาด บันทึกเทรด และวิเคราะห์ข่าว โดยใช้ BoardUI ของจริง ไม่ทำหน้าตาเลียนแบบ ชื่อ TOPTIERclub และข้อความในเว็บเป็นภาษาอังกฤษทั้งหมด

- **Product:** Economic-news and trading-journal workspace for traders
- **Character:** Calm, readable, exact
- **World:** Trading workspace with neutral surfaces and sky-blue selections
- **Moments:** Next-release countdown and the user's journal earnings chart
- **Signature:** Consistent New York release-time marker

ใช้วิธี unslop ของ Damir Sokolovsky: ระยะห่าง → สี → ไอคอน → ข้อความ → ฟอนต์ → โครงหน้า → รายละเอียด → ภาพข้อมูล → การเคลื่อนไหว

## สิ่งที่ตรวจพบ
- ฟอนต์ตัวเลขปัจจุบันเป็น JetBrains Mono จึงดูเหลี่ยมและมีเครื่องหมายในศูนย์
- Home ยังเป็นหน้าคำอธิบายยาว ข่าวไม่มีเครื่องหมายโฟลเดอร์ที่ทำให้เห็นระดับความสำคัญทันที
- Journal วางแบบฟอร์มเต็มหน้า ปฏิทินมือถือใช้ข้อความเล็กและไม่แสดงจำนวนเทรด ส่วน Bar List และ Stat เป็นงานเขียนเอง
- Notification เป็นรายการเล็ก ไม่ใช่ศูนย์แจ้งเตือน ส่วน Settings มีแค่ Dark mode
- Killzones ซ้อนช่วงเวลาในแถบเดียว ทำให้อ่านยาก
- Desk ที่มีอยู่ตอนนี้เป็นกราฟเส้น ไม่พบ lot calculator ในหน้าปัจจุบัน แม้เคยมีมาก่อน จึงต้องนำกลับ ไม่ถือว่ามีอยู่แล้ว
- ระบบข่าวและ signal เป็น XAUUSD เท่านั้น แต่ช่องเรียกกราฟมี XAUUSD, NQ และ ES แล้ว ต้องตรวจว่าข้อมูลจริงเรียกได้ก่อนแสดงว่า Live

## 1. เตรียม BoardUI ก่อนปรับหน้า
จัดรายการต้นทาง ชื่อจริง การติดตั้ง สิทธิ์ใช้งาน และ dependencies ของทุกชิ้นก่อนเริ่มเปลี่ยนหน้า ไม่เอาของเดิมที่เขียนเองมาเรียกว่า BoardUI

| งาน | ต้นทางที่ตรวจพบ / สิ่งที่ต้องตรวจต่อ |
| --- | --- |
| Sidebar, Button, Skeleton, Tag Group | มีหน้า official ของแต่ละชิ้น |
| Drawer, Segmented Control, Progress, Slider | มีหน้า official ของแต่ละชิ้น |
| Notification Center, Settings Modal | มี application block ทางการ |
| Bar List Card, Earnings Chart Card | มีจริง และระบุว่าเป็น **BoardUI Pro** |
| Date Calendar | อยู่ใน catalog; ตรวจ source และความเหมาะสมกับปฏิทิน P&L |
| Dropdown, Tabs, Toast, Stats Card | ตรวจชื่อจริงและ source เพิ่มก่อนติดตั้ง |
| Display/spacing controls, asset search | ตรวจว่าเป็น component หรือ composed pattern ทางการ |

**เงื่อนไขสำคัญ:** หน้าเว็บตัวอย่างไม่ใช่ source ของ Pro จะใช้ CLI ตามวิธีทางการสำหรับชิ้นที่เข้าถึงได้ และขอชุด source ที่ดาวน์โหลดจากสิทธิ์ BoardUI Pro สำหรับชิ้นที่ล็อกไว้ ไม่ขอรหัสผ่านหรือ license key ในแชท ไม่ซื้อแทนและไม่สร้าง lookalike แทนเงียบ ๆ งานที่ยังไม่มี source จะระบุว่ารอ ไม่อ้างว่าติดตั้งครบ

Glisse ที่ส่งมาเป็นไลบรารี React แบบ MIT ไม่ใช่ skill และไม่ใช่ BoardUI ใช้เป็นชั้น liquid-glass เสริมเฉพาะพื้นผิว ไม่แทน controls ของ BoardUI พร้อมเก็บ LICENSE และตรวจบนมือถือ/SSR ก่อนใช้

## 2. ฟอนต์ สี และขนาด
- ใช้ **DM Sans** สำหรับข้อความและตัวเลขทั้งหมด ตัด mono ออกจากหน้าจอ ใช้ tabular figures พร้อมศูนย์ธรรมดา ไม่มีจุดหรือเส้นเฉียง
- น้ำหนัก 400/500, letter spacing 0; ข้อความหลัก 14–16px ไม่ลดตัวเลขปฏิทินให้เล็กเพื่อยัดให้พอดี
- Sky blue ตามสีที่ให้ไว้เป็น accent เดียว ทั้งปุ่ม เลือกสถานะ กราฟ progress และ focus
- เขียว/แดงเฉพาะ BUY/SELL และกำไร/ขาดทุน; เครื่องหมาย high-impact folder ใช้ไอคอนกับข้อความ ไม่ย้อมแถวข่าวแดงทั้งแถว
- ตรวจสีคงค้างทั้ง Home, Desk, Journal, Profile, dropdown, toast และ modal ทั้ง dark/light
- ระยะห่างบนฐาน 4px, ปุ่มมือถือแตะได้สะดวก, หน้าเนื้อหากว้างพอ ไม่ขัง dashboard ในคอลัมน์แคบ
- หนึ่ง entrance animation ต่อหน้า เคารพ reduced motion; จุดสถานะกระพริบเฉพาะข่าวที่จะออกภายใน 60 นาที

## 3. Sidebar, top bar, Profile และ Notifications
- Sidebar desktop ประมาณ 260px ยุบเป็น 60px และจำสถานะ: **Home / Calendar / News analysis / Desk / Journal**
- คง compact Next release, disclaimer, theme switch; มือถือใช้ drawer ด้านซ้าย ไม่มี bottom tab bar และไม่คืน History
- Profile ขวาบนเป็นวงกลม รูปจริงถ้ามี มิฉะนั้นใช้ตัวอักษรชื่อหรือไอคอน ไม่แต่งตัวตนผู้ใช้ขึ้นมา
- Bell เปิดรายการย่อ พร้อม **View all notifications** ไป Notification Center
- Notification Center มี All/Unread, mark read, mark all read และ empty state จากเหตุการณ์จริง เช่น ข่าวใกล้ออก การวิเคราะห์ใหม่ หรืองานนำเข้าเสร็จ ไม่สร้างแจ้งเตือนตัวอย่าง
- Profile คงสิ่งที่ทำงานอยู่ เพิ่มการเปิด Settings และข้อมูลการเก็บ Journal/การเชื่อม AI โดยไม่โชว์ API key

## 4. Settings modal
ใช้ Settings Modal ของ BoardUI และแยกหมวด:

| หมวด | ตัวเลือก |
| --- | --- |
| Appearance | Light/Dark, liquid glass on/off, 3 presets: Subtle / Balanced / Clear |
| Display | Comfortable / Compact spacing, ขนาดข้อความ Standard / Large |
| Time | แสดง New York พร้อม EST/EDT ตามฤดูกาล; journal import เลือก timezone ของ export |
| Notifications | เปิด/ปิดแจ้งข่าวใกล้ออกและ AI analysis ใหม่; เสียงปิดไว้ก่อน |
| Journal | สกุลเงิน/หน่วยของบัญชี, export backup, restore, ล้างข้อมูลต้องยืนยัน |
| AI | สถานะ Claude connection, เปิดดูคำสั่งและแนวทางวิเคราะห์, ล้างบทสนทนาต้องยืนยัน |

Glass ปิดเป็นค่าเริ่มต้น ใช้กับ top bar/menu/drawer เท่านั้น ไม่ทำกราฟและแถวตัวเลขโปร่งจนอ่านยาก ทั้งสาม preset เป็นการตั้งค่าของแอป ไม่อ้างว่า Glisse มี preset มาให้แล้ว

## 5. Home และ Calendar
Home เป็น dashboard ใช้งานจริงแทนหน้าอธิบายยาว:
1. **Next release** เป็นข้อมูลหลัก: countdown ใหญ่, เวลา NY, forecast/previous, progress สีฟ้า
2. **Current XAUUSD signal** สรุปเดียว: BUY/SELL/NEUTRAL, confidence, เหตุผลสั้นและเวลาของข้อมูล
3. **Upcoming high-impact news** เริ่ม 4 รายการ เรียงตามเวลา พร้อม Folder icon, “High impact · Red-folder news”, Upcoming/Released, actual/forecast/previous และวันกำกับชัดเจน
4. **Market watch** ค้นหา Gold / Nasdaq / S&P 500 โดยใช้ชื่อและ symbol; ตัวเลขมาจาก feed เท่านั้น
5. **Journal snapshot** P&L และจำนวนเทรดจากรายการของผู้ใช้ พร้อม Add trade

ย้ายเนื้อหา AI แบบละเอียดและ what-if ไป News analysis, คงคำตอบ FAQ ที่ตรวจสอบได้และ disclaimer ไม่ทิ้งความสามารถเดิม

Calendar แยกข่าวตามวัน เน้นข่าวถัดไป แสดงความสำคัญด้วยไอคอนและป้ายข้อความ มือถือไม่ใช้ตารางจิ๋ว ให้เรียงค่าที่อ่านได้ และใช้ Show more กับรายการยาว

## 6. Journal พร้อม sidebar ในชุดเดียวกัน
- ส่วนหัวมีช่วงเวลาและ **Add trade** ปุ่มเดียว เปิด Drawer ไม่วางแบบฟอร์มเต็มหน้า
- Drawer มี Manual / Screenshot / File import; ป้าย source ใน trade list ใช้ Tag Group ของจริง
- ปฏิทินเดือนเป็นพื้นที่ใหญ่หลัก แต่ละวันแสดง net P&L และ “N trades”; คลิกวันแล้วเห็นรายการของวันนั้น
- กำไรเป็นเขียวและขาดทุนเป็นแดงเฉพาะ P&L ของวันนั้น วันว่างไม่มี P&L ปลอม มือถือแตะวันเพื่อดูยอดเต็ม ไม่ตัดจำนวนเงินให้เสียความหมาย
- ปุ่มเปลี่ยนเดือนต้องดูเดือนก่อนหน้าได้จริง ไม่ติด filter “this month” จนข้อมูลหาย
- Earnings Chart ใช้ cumulative net P&L ของเทรดที่เลือก ไม่ใช้ signal history และไม่ใส่ข้อมูลตัวอย่าง
- Stats Card: net P&L, trade count, trading days และค่าจากรายการจริง ไม่มี win rate
- Bar List ตาม instrument/weekday; filters instrument, side, source, period และ P&L slider; ค่าทุกส่วนใช้ชุด filter เดียวกัน
- รายการเทรดแยกวัน เพิ่มแก้ไข/ลบพร้อมยืนยัน, skeleton, toast, empty/error states
- คง guest Journal ที่อยู่ใน browser เดิม ไม่ย้ายหรือลบข้อมูลอัตโนมัติ เพิ่ม backup และจัดการ storage เต็มอย่างชัดเจน

### Tradovate file import
- เริ่มด้วย CSV export ของ Tradovate และ journal backup JSON
- ตรวจ header จริง พร้อม mapping preview เมื่อ schema ไม่ตรง; ต้องมีตัวอย่าง export ที่ลบข้อมูลส่วนตัวแล้วเพื่อยืนยัน mapping
- Preview แถวที่ผ่าน/ผิด/ซ้ำก่อนยืนยัน ไม่ save ทันทีหลังเลือกไฟล์
- Futures แยกจำนวน contracts จาก lots; อ่าน realized P&L และ fees จาก export ไม่ใช้สูตรทองคูณกับ NQ/ES
- ตรวจ timezone, date, side, instrument, finite numeric values, duplicates และยอดรวม ไม่รวมหลายสกุลเงินเป็นยอดเดียว
- ถ้าไฟล์เป็น executions ที่ต้องจับคู่ trades ให้แยกกระบวนการและทดสอบก่อน ไม่เดาแต่ละ fill ว่าเป็นหนึ่ง trade

### Screenshot extraction
Claude อ่านรูปแล้วคืน draft เท่านั้น ให้ผู้ใช้ตรวจวันที่ สินทรัพย์ size/units entry/exit P&L/fees ก่อน Save ไม่แต่งค่าที่อ่านไม่ได้ ไม่อ้างว่า screenshot พิสูจน์ผลเทรดได้

## 7. News analysis และ Claude chat
- หน้า News analysis รวม weekly outlook, pre-release calls 24h/15m, scenario beat/miss และ what-if เดิม แสดงรอบและเวลาของการวิเคราะห์ชัดเจน
- เชื่อม calls กับ ID/เวลาข่าวปัจจุบัน ไม่แสดง cached ข่าวเก่าว่าเป็น upcoming และไม่เปลี่ยนระบบ FRED/การบันทึก signal โดยไม่จำเป็น
- เพิ่มแชท **บทสนทนาเดียว** ตามคำตอบของคุณ เก็บใน Lovable Cloud แยกตามผู้ใช้ที่ sign in; guest Journal ยังใช้ได้โดยไม่ sign in
- ใช้ **Anthropic Claude กับ API key ของคุณ** สำหรับแชทและ screenshot เก็บ key ฝั่ง server ผ่านแบบฟอร์มปลอดภัย ไม่ใส่ใน Settings/browser
- คง AI ข่าวที่ใช้ Lovable เดิมไว้จนตรวจ integration ใหม่ผ่าน ไม่เปลี่ยน provider ทุกจุดโดยเงียบ ๆ
- พิมพ์ `/` แล้วเลือกคำสั่ง เช่น `/news`, `/chart`, `/risk`, `/review`, `/help`; แสดงแนวทางที่เลือกในคำตอบ
- จัดทำแนวทางวิเคราะห์ข่าว/กราฟ/ความเสี่ยงแยกกัน ตรวจแหล่งที่มาและ licensing ของ skill ที่นำมาใช้ ให้เจ้าของตรวจ prompt ก่อนใช้งาน ไม่ถือว่า workspace skill ถูกส่งไปในแอปอัตโนมัติ
- แยก facts/inferences, บอกเวลาและแหล่งข้อมูล, ไม่รับประกันผล ไม่ใช้ confidence 100%, ไม่แต่งราคา real-time จากความจำโมเดล
- Upload รูปได้, stream คำตอบ, Stop, retry จากการกระทำใหม่ของผู้ใช้, แสดงข้อจำกัด/ข้อผิดพลาดจริง ห้ามอ้างรู้ quota ของ Claude ถ้า provider ไม่ส่งข้อมูลนั้น
- ใช้ AI Elements สำหรับข้อความ/composer/loading/tool output; ใช้ BoardUI จัดกรอบและ navigation ไม่แทน primitives แชทด้วยงานเขียนเอง

Claude มีให้ผ่าน Lovable ด้วย แต่แผนนี้ยึด API ของคุณตามที่เลือก การใช้ key ของคุณจะไม่มีการติดตามค่า AI ผ่านเครดิต Lovable; จะขอ key อย่างปลอดภัยเมื่อพร้อมเชื่อมจริง

## 8. Desk, asset search และ Killzones
- คงกราฟ Desk, นำ lot calculator กลับจากสูตรเดิมที่ทดสอบไว้ และรักษาข้อมูล signal
- ค้นหาสินทรัพย์หลักเริ่ม XAUUSD / NQ / ES ตามเส้นทางข้อมูลที่มีอยู่; ตรวจข้อมูลจริงและแสดง unavailable แทนค่าปลอม
- ส่วน signal ยังระบุ XAUUSD ชัดเจน ไม่ใช้ gold bias เป็น Nasdaq/S&P signal โดยเปลี่ยนแค่ชื่อ
- Killzones ใช้แถว timeline แยก Asian / London open / New York open / London close ไม่ซ้อนกัน มีเส้นเวลาปัจจุบันหนึ่งเส้นและช่วงเวลา NY อ่านได้
- แสดง session window ไม่อ้างยืนยันตลาดเปิดจากนาฬิกาอย่างเดียว รองรับข้ามเที่ยงคืน DST และ weekend states ด้วย tests

## การทำงานและตรวจรับ
1. เตรียม source inventory และ dependencies BoardUI ทุกชิ้น รวม Glisse; แจ้งชิ้นที่ติด Pro
2. ปรับ typography/tokens + sidebar/top bar/settings + Journal layout พร้อมกัน
3. จัด Home/Calendar/News analysis, Notifications/Profile และ Desk/Killzones
4. Implement validated CSV/JSON import และ screenshot drafts
5. เชื่อม Claude chat/commands แล้วตรวจ input รูปและประวัติจริง

ตรวจ desktop/mobile ทั้ง dark/light และ glass ทั้งสามแบบ ไม่มี overflow; เพิ่ม tests สำหรับรายวัน/จำนวนเทรด/filters/import duplicate/contracts/timezones และ killzones; ทดลองเพิ่ม-อ่าน-แก้-ลบเทรดพร้อม reload, นำเข้าและ backup, และส่งข้อความ/รูปจริงก่อนบอกว่า AI ใช้ได้ ทุก content route ได้ title/description/OG ของตัวเอง

**สิ่งที่ต้องมีเพื่อให้จบทั้งหมด:** BoardUI Pro source หรือสิทธิ์ติดตั้งที่ถูกต้อง, ตัวอย่าง Tradovate CSV, Claude key ผ่านแบบฟอร์มปลอดภัย งานที่ไม่ต้องรอสิ่งเหล่านี้ทำต่อได้ แต่จะไม่รายงานว่าทั้งหมดเสร็จจนตรวจครบ