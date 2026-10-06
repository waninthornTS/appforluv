// รายชื่อจังหวัดและประเทศ (ไทย / English)
import { isEn } from './i18n';

const PROVINCES_TH = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชลบุรี', 'ชัยนาท',
  'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม',
  'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์',
  'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา', 'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์',
  'แพร่', 'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง',
  'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
  'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์', 'หนองคาย',
  'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี',
];
const PROVINCES_EN = [
  'Bangkok', 'Krabi', 'Kanchanaburi', 'Kalasin', 'Kamphaeng Phet', 'Khon Kaen', 'Chanthaburi', 'Chachoengsao', 'Chonburi', 'Chai Nat',
  'Chaiyaphum', 'Chumphon', 'Chiang Rai', 'Chiang Mai', 'Trang', 'Trat', 'Tak', 'Nakhon Nayok', 'Nakhon Pathom', 'Nakhon Phanom',
  'Nakhon Ratchasima', 'Nakhon Si Thammarat', 'Nakhon Sawan', 'Nonthaburi', 'Narathiwat', 'Nan', 'Bueng Kan', 'Buriram', 'Pathum Thani', 'Prachuap Khiri Khan',
  'Prachinburi', 'Pattani', 'Ayutthaya', 'Phayao', 'Phang Nga', 'Phatthalung', 'Phichit', 'Phitsanulok', 'Phetchaburi', 'Phetchabun',
  'Phrae', 'Phuket', 'Maha Sarakham', 'Mukdahan', 'Mae Hong Son', 'Yasothon', 'Yala', 'Roi Et', 'Ranong', 'Rayong',
  'Ratchaburi', 'Lopburi', 'Lampang', 'Lamphun', 'Loei', 'Sisaket', 'Sakon Nakhon', 'Songkhla', 'Satun', 'Samut Prakan',
  'Samut Songkhram', 'Samut Sakhon', 'Sa Kaeo', 'Saraburi', 'Sing Buri', 'Sukhothai', 'Suphanburi', 'Surat Thani', 'Surin', 'Nong Khai',
  'Nong Bua Lamphu', 'Ang Thong', 'Amnat Charoen', 'Udon Thani', 'Uttaradit', 'Uthai Thani', 'Ubon Ratchathani',
];
export const provinces = () => (isEn() ? PROVINCES_EN : PROVINCES_TH);

// [ISO code, ชื่อไทย, English]
const LIST: [string, string, string][] = [
  ['JP', 'ญี่ปุ่น', 'Japan'], ['KR', 'เกาหลีใต้', 'South Korea'], ['CN', 'จีน', 'China'], ['TW', 'ไต้หวัน', 'Taiwan'], ['HK', 'ฮ่องกง', 'Hong Kong'], ['MO', 'มาเก๊า', 'Macau'],
  ['SG', 'สิงคโปร์', 'Singapore'], ['MY', 'มาเลเซีย', 'Malaysia'], ['VN', 'เวียดนาม', 'Vietnam'], ['LA', 'ลาว', 'Laos'], ['KH', 'กัมพูชา', 'Cambodia'], ['MM', 'เมียนมา', 'Myanmar'],
  ['ID', 'อินโดนีเซีย', 'Indonesia'], ['PH', 'ฟิลิปปินส์', 'Philippines'], ['IN', 'อินเดีย', 'India'], ['NP', 'เนปาล', 'Nepal'], ['BT', 'ภูฏาน', 'Bhutan'], ['LK', 'ศรีลังกา', 'Sri Lanka'],
  ['MV', 'มัลดีฟส์', 'Maldives'], ['AE', 'สหรัฐอาหรับเอมิเรตส์', 'UAE'], ['TR', 'ตุรกี', 'Türkiye'], ['GE', 'จอร์เจีย', 'Georgia'], ['FR', 'ฝรั่งเศส', 'France'], ['IT', 'อิตาลี', 'Italy'],
  ['CH', 'สวิตเซอร์แลนด์', 'Switzerland'], ['DE', 'เยอรมนี', 'Germany'], ['GB', 'สหราชอาณาจักร', 'United Kingdom'], ['ES', 'สเปน', 'Spain'], ['NL', 'เนเธอร์แลนด์', 'Netherlands'], ['AT', 'ออสเตรีย', 'Austria'],
  ['CZ', 'เช็กเกีย', 'Czechia'], ['GR', 'กรีซ', 'Greece'], ['NO', 'นอร์เวย์', 'Norway'], ['FI', 'ฟินแลนด์', 'Finland'], ['IS', 'ไอซ์แลนด์', 'Iceland'], ['US', 'สหรัฐอเมริกา', 'United States'],
  ['CA', 'แคนาดา', 'Canada'], ['AU', 'ออสเตรเลีย', 'Australia'], ['NZ', 'นิวซีแลนด์', 'New Zealand'], ['EG', 'อียิปต์', 'Egypt'], ['MA', 'โมร็อกโก', 'Morocco'], ['ZZ', 'อื่นๆ', 'Other'],
];
export const countries = () => LIST.map(([code, th, en]) => ({ code, name: isEn() ? en : th }));

export function flag(code?: string) {
  if (!code || code === 'ZZ') return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
}
export const countryName = (code?: string) => countries().find(c => c.code === code)?.name || '';
