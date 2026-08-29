import { readStore, writeStore, nextId } from './db.js';

interface DayRecord {
  id: number;
  day_number: number;
  date: string;
  weekday: string;
  city: string;
  city_en: string;
  content_json: string;
  sort_order: number;
}

interface ExpenseRecord {
  id: number;
  date: string;
  category: string;
  sub_category: string;
  amount: number;
  currency: string;
  split_count: number;
  per_person: number;
  note: string;
}

interface ChecklistRecord {
  id: number;
  label: string;
  checked: number;
  sort_order: number;
}

interface BookingRecord {
  id: number;
  city: string;
  date: string;
  attraction: string;
  price: string;
  need_reservation: number;
  booking_link: string;
  note: string;
  sort_order: number;
}

export function seedIfNeeded() {
  const days = readStore<DayRecord[]>('days', []);
  if (days.length > 0) return;

  // Trip Info
  const tripInfo = {
    title: '挚友十年行',
    dateRange: '2026/9/23 - 2026/10/6',
    totalDays: 14,
    travelDays: 11,
    destination: '意大利（西西里岛 → 南意大利 → 罗马）',
    cities: ['北京', '巴勒莫', '陶尔米纳', '锡拉库萨', '那不勒斯', '庞贝', '罗马', '北京'],
    notices: {
      transport: [
        '火车纸质票上车前必须自行检票打卡。建议将票紧贴打票机最左侧插入，成功时机器亮绿灯，同时检查票上是否有打票时间，确认成功后再上车，否则会被罚款。',
        '出行前均需提前一天确认火车时刻，意大利火车延误或提前发车风险较大',
        '需提前30分钟抵达火车站',
      ],
      travel: [
        '防盗！防盗！防盗！手机握手里，包包放怀里',
        '带水、带伞、带纸巾、带现金。意大利喝水要钱、上厕所要钱',
      ],
      daily: '意大利大部分自来水为硬水，可尝试公共直饮水点，建议烧水或购买瓶装水。瓶装水分两种：Naturale（纯净水）、Frizzante（气泡水）',
    },
    flights: {
      outbound: {
        title: '去程：北京 → 巴勒莫',
        date: '9/24（当地时间）',
        segments: [
          { type: 'flight', label: '第一段', departure: { city: '北京', time: '9/24 00:10', airport: '北京首都T1' }, arrival: { city: '伊斯坦布尔', time: '9/24 05:30' }, duration: '10.5h', airline: '土耳其航空', flightNo: 'TK89' },
          { type: 'transit', label: '中转', duration: '1.5h', location: '伊斯坦布尔机场' },
          { type: 'flight', label: '第二段', departure: { city: '伊斯坦布尔', time: '9/24 06:50' }, arrival: { city: '巴勒莫', time: '9/24 08:25' }, duration: '2.5h', airline: '土耳其航空', flightNo: 'TK1373' },
        ],
        tips: ['提前24h通过土耳其航空官网或APP提前选座', '托运时要求箱子贴上"优先"贴纸，确认是否可以正常中转', '中转时间很短（1.5h），下飞机后需快速前往转机', '第二段出海关时不能太慢，最好亲眼等到行李出来'],
      },
      inbound: {
        title: '返程：罗马 → 北京',
        date: '10/5-10/6（当地时间）',
        segments: [
          { type: 'flight', label: '第一段', departure: { city: '罗马', time: '10/5 14:55', airport: '罗马 Fiumicino T1' }, arrival: { city: '法兰克福', time: '10/5 16:55' }, duration: '2h', airline: '汉莎航空', flightNo: 'LH235' },
          { type: 'transit', label: '中转', duration: '3h', location: '法兰克福机场' },
          { type: 'flight', label: '第二段', departure: { city: '法兰克福', time: '10/5 19:50' }, arrival: { city: '北京', time: '10/6 11:15' }, duration: '9.5h', airline: '国航', flightNo: 'CA932' },
        ],
        tips: ['坐罗马机场快线到机场：导航"Roma Termini"，寻找红色1号车牌', '值机时确认行李是否可直挂北京'],
      },
    },
  };
  writeStore('trip_info', tripInfo);

  // Days data
  const daysData: DayRecord[] = [
    { id: 1, day_number: 1, date: '9/24', weekday: '周四', city: '巴勒莫', city_en: 'Palermo', sort_order: 1, content_json: JSON.stringify({
      overview: { text: '意大利旅游正式开始，从美丽的西西里岛首府巴勒莫出发吧！去深刻感受这座衰败与辉煌并存的城市吧。', cityIntro: '巴勒莫——意大利西西里岛的首府，一座衰败与辉煌并存的城市。拥有超2700年的历史，曾是一个阿拉伯酋长国，也曾是诺曼王国的首府，催生出"阿拉伯-诺曼风格"建筑。' },
      accommodation: { city: '巴勒莫', checkIn: '9/24-9/25，入住15:00，退房10:00', address: 'Via delle Pergole, 60, Palermo', condition: '整租公寓，3间卧室，1间卫生间，1张双人床+3张单人床+1张沙发床', checkInMethod: '钥匙盒', lat: 38.1157, lng: 13.3615 },
      tips: { items: ['出海关冲前面盯行李，防止行李丢失', '下午才能入住，需先行李寄存，导航 CoverCity Palermo，5€/箱'], packingList: ['披肩外套','墨镜','防晒霜','雨伞','充电宝','护照','现金','相机'] },
      locations: [
        { name: '巴勒莫市场', nameIt: 'Ballarò', hours: '10:30-17:00', cost: '50€', tags: ['美食'], duration: '2h', tips: '一大早就去，一定要带现金；吃牛肚包、炸饭团、血橙', lat: 38.1115, lng: 13.3645, order: 1 },
        { name: '巴勒莫耶稣堂', nameIt: 'Chiesa del Gesu', hours: '9:00-18:30', cost: '2€', tags: ['景点'], duration: '1h', tips: '现场买门票2€', intro: '西西里巴洛克体系的极致装饰化代表。教堂内部布满精美的大理石镶嵌和金色装饰，展现了17世纪西西里艺术的巅峰水平。立面采用典型的西西里巴洛克风格，曲线优美，雕塑繁复。', lat: 38.1112, lng: 13.3597, order: 2 },
        { name: '诺曼王宫&帕拉蒂尼礼拜堂', nameIt: 'Palazzo dei Normanni', hours: '8:30-16:30', cost: '19€', tags: ['景点'], duration: '2h', tips: '先冲2楼礼拜堂错开人流；不得穿着暴露', intro: '西西里岛最古老的王宫，始建于9世纪阿拉伯统治时期。帕拉蒂尼礼拜堂是精华所在，融合了拜占庭金色马赛克、阿拉伯蜂巢状穹顶和拉丁式建筑结构，被誉为"阿拉伯-诺曼风格"的巅峰之作。马赛克描绘基督全能者像，金光璀璨。', lat: 38.1100, lng: 13.3545, order: 3 },
        { name: '巴勒莫主教堂', nameIt: 'Cattedrale di Palermo', hours: '7:00-19:00', cost: '免费', tags: ['景点'], duration: '1h', tips: '主殿免费，登顶7€', intro: '建于1184年的大教堂，是阿拉伯-诺曼风格的杰出代表。建筑融合了阿拉伯、诺曼、哥特和新古典等多种风格元素，见证了巴勒莫多元文化的历史交融。内部安放着神圣罗马帝国皇帝腓特烈二世的石棺。登顶可俯瞰全城。', lat: 38.1117, lng: 13.3385, order: 4 },
        { name: '马西莫剧院', nameIt: 'Teatro Massimo', cost: '免费', tags: ['景点'], duration: '10min', tips: '外面路过即可，《教父3》终 scene 拍摄地', intro: '意大利最大、欧洲第三大歌剧院，仅次于巴黎和维也纳。建于1897年，新古典主义建筑风格，正面是巨大的科林斯柱廊。《教父3》结尾经典场景在此拍摄——阿尔·帕西诺在剧院台阶上发出撕心裂肺的哀嚎。', lat: 38.1145, lng: 13.3525, order: 5 },
        { name: '意大利菜 Trattoria del Massimo', nameIt: 'Trattoria del Massimo', hours: '09:00-15:30/18:30-23:00', cost: '20€', tags: ['美食'], tips: '必点西西里红虾面', lat: 38.1148, lng: 13.3528, order: 6 },
        { name: '四角广场', nameIt: 'Quattro Canti', cost: '免费', tags: ['景点'], duration: '30min', intro: '巴勒莫最经典的巴洛克十字路口，建于1608年。四个角各有一座喷泉，代表四季（春、夏、秋、冬）和四位西班牙国王。建筑立面精美，是巴勒莫巴洛克艺术的标志性景观。', lat: 38.1113, lng: 13.3573, order: 7 },
        { name: '普雷托利亚喷泉', nameIt: 'Fontana Pretoria', cost: '免费', tags: ['景点'], duration: '10min', tips: '维修中，外面路过', intro: '建于1555年的文艺复兴时期喷泉，原为佛罗伦萨私人别墅所建，后移至巴勒莫。因周围裸体雕像众多，被当地人称为"羞耻之泉"。层层叠叠的雕塑和喷水池构成精美的水力艺术品。', lat: 38.1115, lng: 13.3580, order: 8 },
        { name: 'Ganci面包店', nameIt: 'Rosticceria da Ganci', hours: '24h', cost: '2€', tags: ['美食'], tips: '面包1€，强推肉酱炸饭团', lat: 38.1218, lng: 13.3635, order: 9 },
      ],
      transport: { intercity: [{ desc: '巴勒莫机场 → 巴勒莫市区', duration: '1h', cost: '6.8€', tips: '现场购票；跟随"TRENI"指示牌' }], intracity: [{ mode: '公交车', details: '烟草店购票1.4€，车上1.8€。通用票，上车打票，90min内有效。' }] },
    }) },
    { id: 2, day_number: 2, date: '9/25', weekday: '周五', city: '陶尔米纳', city_en: 'Taormina', sort_order: 2, content_json: JSON.stringify({
      overview: { text: '前往"西西里阳台"陶尔米纳，当埃特纳火山与爱奥尼亚海同时映入眼帘，便可以明白它为何是贵族的避世胜地。', cityIntro: '陶尔米纳坐落于西西里岛东岸海拔约200米的悬崖山脊之上，面朝爱奥尼亚海，背靠埃特纳火山。人口仅万人，自古是贵族、艺术家的避世胜地。' },
      accommodation: { city: '陶尔米纳', checkIn: '9/25-9/26，入住14:00，退房10:00', address: 'Via Otto Geleng, 75', condition: '整租公寓85㎡，2间卧室，1间卫生间', checkInMethod: '', lat: 37.8526, lng: 15.2865 },
      tips: { items: ['重点位置：火车站Taormina Giardini（山下）、公交车站Terminal Bus（山上）、市中心Centro（山上）', '晚饭待定'], packingList: [] },
      locations: [{ name: 'Parco Trevelyan', nameIt: 'Parco Trevelyan', hours: '8:00-20:00', cost: '免费', tags: ['景点'], duration: '30min', intro: '位于陶尔米纳市中心的小型公园，是俯瞰埃特纳火山和纳克索斯湾的绝佳观景点。园内绿树成荫，可远眺爱奥尼亚海和火山全景，是拍摄经典明信片机位。', lat: 37.8535, lng: 15.2870, order: 1 }],
      transport: { intercity: [{ desc: '巴勒莫 → 陶尔米纳', duration: '5h', cost: '20€', tips: '换乘2次大巴。巴勒莫Fazello站→卡塔尼亚→陶尔米纳Terminal' }], intracity: [] },
    }) },
    { id: 3, day_number: 3, date: '9/26', weekday: '周六', city: '陶尔米纳', city_en: 'Taormina', sort_order: 3, content_json: JSON.stringify({
      overview: { text: '贝拉岛将是今天最重要的行程，俯瞰这座爱心状的小岛，漫步在洁白的沙滩上。' },
      accommodation: { city: '陶尔米纳', checkIn: '9/26-9/28，入住15:00，退房10:00', address: 'Via Giuseppe di Vittorio, 16, Taormina', condition: '整租公寓，2间卧室，2间卫生间', checkInMethod: '通过大楼员工协助自助入住', tips: '需缴纳住宿税1€/人/天；抵达公寓需爬60m陡坡', lat: 37.8510, lng: 15.2830 },
      tips: { items: [], packingList: ['泳衣','浴巾','溯溪鞋','墨镜','防晒霜','雨伞','充电宝','护照','现金','相机'] },
      locations: [
        { name: '贝拉岛观景平台', nameIt: 'Belvedere di Via Pirandello', hours: '24h', cost: '免费', tags: ['景点'], duration: '1h', intro: '位于陶尔米纳下山路上的观景台，是俯瞰Isola Bella爱心小岛的最佳机位。可拍摄到小岛与碧蓝海水的经典画面，尤其在日落时分景色绝美。', lat: 37.8490, lng: 15.2845, order: 1 },
        { name: '贝拉岛', nameIt: 'Isola Bella', hours: '24h', cost: '免费', tags: ['景点'], duration: '2h', tips: '退潮时去，备好溯溪鞋', intro: '陶尔米纳的标志性景点，因形状酷似爱心而得名"美丽岛"。退潮时会出现一条沙洲与陆地相连，可步行前往。岛上植被茂密，海水清澈见底，是西西里最美的海滩之一。', lat: 37.8478, lng: 15.2855, order: 2 },
      ],
      transport: { intercity: [], intracity: [{ mode: '公交车/缆车', details: '缆车：Via Pirandello 22→Mazzarò海滩，单程6€，往返10€' }] },
    }) },
    { id: 4, day_number: 4, date: '9/27', weekday: '周日', city: '锡拉库萨', city_en: 'Siracusa', sort_order: 4, content_json: JSON.stringify({
      overview: { text: '探访锡拉库萨，比罗马更加古老的希腊遗迹，奥提伽岛将是今天最重要的行程。' },
      accommodation: { sameAsPrevious: true, city: '陶尔米纳', address: 'Via Giuseppe di Vittorio, 16' },
      tips: { items: [], packingList: [] },
      locations: [
        { name: '阿波罗神庙', nameIt: 'Tempio di Apollo', cost: '免费', tags: ['景点'], duration: '1h', intro: '建于公元前6世纪的希腊神庙遗址，是锡拉库萨最古老的希腊遗迹。巨大的多立克柱式石柱矗立两千余年，见证了古希腊殖民者在西西里的辉煌历史。', lat: 37.0600, lng: 15.2920, order: 1 },
        { name: '锡拉库萨教堂广场', nameIt: 'Piazza del Duomo', cost: '2€', tags: ['景点'], duration: '1h', intro: '奥提伽岛的心脏地带，被华丽的巴洛克建筑群环绕。广场中央矗立着圣露西亚柱，纪念锡拉库萨的主保圣人。周围咖啡馆林立，是当地人休闲聚会的首选场所，也是感受西西里慢生活的绝佳去处。', lat: 37.0590, lng: 15.2925, order: 2 },
        { name: '马尼亚切城堡', nameIt: 'Maniace Castle', cost: '5€', tags: ['景点'], duration: '1h', intro: '由神圣罗马帝国皇帝腓特烈二世于13世纪建造的海边堡垒。城堡呈方形，四角各有一座圆形塔楼，是军事建筑与皇家宫殿的完美结合。站在城堡上可远眺奥提伽岛和大海，视野开阔。', lat: 37.0540, lng: 15.2960, order: 3 },
      ],
      transport: { intercity: [{ desc: '火车：陶尔米纳 ↔ 锡拉库扎', duration: '2h', cost: '80 RMB', departure: 'Taormina-Giardini', time: '10:00-11:57', tips: '坐在左侧可看到海景' }], intracity: [{ mode: '公交车', details: '红色面包车，需招手停车。目的地奥提伽岛Ortigia。' }] },
    }) },
    { id: 5, day_number: 5, date: '9/28', weekday: '周一', city: '陶尔米纳', city_en: 'Taormina', sort_order: 5, content_json: JSON.stringify({
      overview: { text: '继续在陶尔米纳漫步，夜幕降临时，搭乘过夜火车告别西西里。' },
      accommodation: null,
      tips: { items: ['10:00退房，行李寄存在火车站附近', '关注下山抵达火车站的末班车'], packingList: [] },
      locations: [
        { name: '古希腊罗马剧场', nameIt: 'Teatro Greco', hours: '8:00-20:00', cost: '17€', tags: ['景点'], duration: '30min', intro: '西西里第二大古希腊剧场，建于公元前3世纪，可容纳5400名观众。剧场依山而建，面朝爱奥尼亚海和埃特纳火山，是古希腊人将戏剧与自然美景完美结合的杰作。至今仍用于举办演出。', lat: 37.8530, lng: 15.2910, order: 1 },
        { name: '翁贝托一世街', nameIt: 'Corso Umberto', hours: '10:00-21:00', cost: '不定', tags: ['购物'], duration: '2h', intro: '陶尔米纳的主街，贯穿整个小镇。街道两旁林立着奢侈品店、手工艺品店、咖啡馆和餐厅。从高端时装到当地特色纪念品，应有尽有，是购物和感受小镇氛围的必到之处。', lat: 37.8525, lng: 15.2860, order: 2 },
        { name: '四月九日广场', nameIt: 'Piazza IX Aprile', cost: '不定', tags: ['购物'], duration: '1h', intro: '陶尔米纳的中心广场，位于翁贝托一世街中段。广场四周环绕着中世纪教堂和咖啡馆，是当地人和游客休憩的热门地点。从这里可以俯瞰远处的海景和埃特纳火山。', lat: 37.8528, lng: 15.2855, order: 3 },
      ],
      transport: { intercity: [{ desc: '过夜火车：陶尔米纳 → 那不勒斯', departure: 'Taormina-Giardini', time: '23:35-07:42(+1)', duration: '约10h', cost: '50€+', tips: '提前邮箱核实出发时间；四人间/双人间' }], intracity: [{ mode: '公交车/缆车', details: '缆车单程6€，往返10€' }] },
    }) },
    { id: 6, day_number: 6, date: '9/29', weekday: '周二', city: '索伦托', city_en: 'Sorrento', sort_order: 6, content_json: JSON.stringify({
      overview: { text: '清晨抵达那不勒斯，存好行李后前往索伦托，探访"乔瓦娜秘境"的果冻海。' },
      accommodation: { city: '那不勒斯', checkIn: '9/29-10/2，入住15:00，退房10:00', address: 'Vico Giganti, 55, Naples', condition: '整租公寓，4间卧室，4间卫生间', checkInMethod: '', tips: '公寓4楼无电梯；晚22:30后入住额外10€', lat: 40.8518, lng: 14.2687 },
      tips: { items: ['那不勒斯寄存行李 deposito bagagli，华人老板，5€/件/自然日', '考虑桨板体验划到乔瓦娜秘境，390 RMB/人'], packingList: ['泳衣','浴巾','溯溪鞋','墨镜','防晒霜','雨伞','充电宝','护照','现金','相机'] },
      locations: [{ name: '乔瓦娜秘境', nameIt: 'Capo di Sorrento', hours: '24h', cost: '免费', tags: ['景点'], duration: '3h', tips: '带泳衣浴巾和食物', intro: '位于索伦托半岛的天然海蚀洞穴，因碧蓝如翡翠般的海水而被称为"果冻海"。需乘船或桨板穿过狭窄的洞口才能进入，洞内水面平静，阳光折射形成梦幻般的光影效果，是阿马尔菲海岸最隐秘的景点之一。', lat: 40.6260, lng: 14.3810, order: 1 }],
      transport: { intercity: [{ desc: '火车：那不勒斯 → 索伦托', departure: 'Napoli Porta Nolana', duration: '1h', cost: '4.6€', tips: '乘坐Circumvesuviana近郊火车' }], intracity: [{ mode: '公交车', details: 'UnicoCampania APP购票' }] },
    }) },
    { id: 7, day_number: 7, date: '9/30', weekday: '周三', city: '那不勒斯', city_en: 'Naples', sort_order: 7, content_json: JSON.stringify({
      overview: { text: '上午去圣塞维诺小堂见证《蒙面纱的耶稣》。傍晚登上圣埃莫堡看日落红屋顶。' },
      accommodation: { sameAsPrevious: true, city: '那不勒斯', address: 'Vico Giganti, 55' },
      tips: { items: [], packingList: ['披肩外套','墨镜','防晒霜','雨伞','充电宝','护照','现金','相机'] },
      locations: [
        { name: '圣塞维诺小堂', nameIt: 'Museo Cappella Sansevero', hours: '预约10:30', cost: '12€', tags: ['景点'], duration: '2h', tips: '先到Ticket Office换纸质票；禁止拍照', intro: '建于16世纪的小教堂，是那不勒斯最神秘的艺术殿堂。镇馆三杰：朱塞佩·圣马蒂诺的《蒙面纱的耶稣》以大理石雕刻出薄如蝉翼的面纱质感，被誉为世界最伟大雕塑之一；《缠绳的解放者》和《贞洁》同样令人叹为观止。', lat: 40.8485, lng: 14.2538, order: 1 },
        { name: '圣埃莫堡', nameIt: "Castel Sant'Elmo", hours: '预约17:00', cost: '5€(16:00后2.5€)', tags: ['景点'], duration: '2h', tips: '18:30前必须进城堡；看日落红屋顶', intro: '建于14世纪的山顶城堡，是那不勒斯的制高点。城堡呈六角星形，是军事防御建筑的杰作。从城堡可360度俯瞰那不勒斯全城、维苏威火山和那不勒斯湾，日落时分整个城市被染成金红色，是拍摄城市全景的最佳机位。', lat: 40.8440, lng: 14.2400, order: 2 },
        { name: '披萨 Spizzuliann', nameIt: "pe' Toledo", tags: ['美食'], lat: 40.8460, lng: 14.2500, order: 3 },
        { name: '手工皮具店 Scriptura', nameIt: 'Scriptura', tags: ['购物'], address: 'Via S. Sebastiano, 45', lat: 40.8475, lng: 14.2530, order: 4 },
      ],
      transport: { intercity: [], intracity: [{ mode: '地铁/缆车', details: '单程1.1€，24h日票3.5€。刷卡或纸质票（务必打票）。' }] },
    }) },
    { id: 8, day_number: 8, date: '10/1', weekday: '周四', city: '庞贝', city_en: 'Pompeii', sort_order: 8, content_json: JSON.stringify({
      overview: { text: '前往庞贝古城，漫步在公元79年的街道上。一切都被火山灰定格。' },
      accommodation: { sameAsPrevious: true, city: '那不勒斯', address: 'Vico Giganti, 55' },
      tips: { items: [], packingList: ['食物','水','墨镜','防晒霜','雨伞','充电宝','护照','现金','相机'] },
      locations: [{ name: '庞贝古城', nameIt: 'Pompeii', hours: '预约10:00', cost: '500 RMB', tags: ['景点'], duration: '4h', intro: '公元79年维苏威火山爆发，整座罗马城市被火山灰瞬间掩埋，直到18世纪才被重新发掘。古城完整保存了街道、房屋、浴场、剧场和广场，石膏模型定格了遇难者最后的姿态。漫步其中，仿佛穿越回两千年前的罗马帝国。', lat: 40.7508, lng: 14.4870, order: 1 }],
      transport: { intercity: [{ desc: '火车：那不勒斯 → 庞贝', departure: 'Napoli Porta Nolana', duration: '30min', cost: '3.3€', tips: '买到Pompei Scavi – Villa dei Misteri站' }], intracity: [] },
    }) },
    { id: 9, day_number: 9, date: '10/2', weekday: '周五', city: '罗马', city_en: 'Roma', sort_order: 9, content_json: JSON.stringify({
      overview: { text: '吃完早饭去那不勒斯主教堂告别，中午抵达罗马，初遇"永恒之城"。' },
      accommodation: { city: '罗马', checkIn: '10/2-10/5，入住15:00，退房11:00', address: 'Via Montebello, 109, Roma', condition: '整租公寓，2间卧室，1间卫生间', checkInMethod: '密码锁', lat: 41.9100, lng: 12.5040 },
      tips: { items: ['11:00退房前逛完主教堂回来不用存行李'], packingList: [] },
      locations: [
        { name: '那不勒斯主教堂', nameIt: 'Duomo di Napoli', hours: '10:00-17:00 周三闭', cost: '免费', tags: ['景点'], duration: '1h', intro: '那不勒斯的主教座堂，建于13世纪。教堂内保存着圣雅纳略的血液，每年三次举行"圣血液化"仪式——干涸的血液在特定日期神奇地变为液态，被视为神迹。教堂的圣雅纳略礼拜堂装饰华丽，是巴洛克艺术的杰作。', lat: 40.8530, lng: 14.2625, order: 1 },
        { name: '圣依纳爵堂', nameIt: 'Piazza S. Ignazio', hours: '9:00-23:30', cost: '免费', tags: ['景点'], duration: '1h', tips: '晚上去看假穹顶天顶画', intro: '教堂内有一幅令人惊叹的透视壁画，由17世纪画家安德里亚·波佐绘制。站在特定位置仰望，平面的天花板呈现出360度穹顶的立体效果，仿佛教堂直通天堂，是透视法艺术的巅峰之作。', lat: 40.8490, lng: 14.2520, order: 2 },
      ],
      transport: { intercity: [{ desc: '火车：那不勒斯 → 罗马', departure: 'Napoli Central', duration: '1.5h', cost: '19€-50€', tips: '提前网上购票，勾选"保障车次"' }], intracity: [{ mode: '地铁/步行', details: '同那不勒斯交通' }] },
    }) },
    { id: 10, day_number: 10, date: '10/3', weekday: '周六', city: '梵蒂冈', city_en: 'Vatican', sort_order: 10, content_json: JSON.stringify({
      overview: { text: '梵蒂冈是今天的主题。在圣彼得大教堂仰望穹顶，在西斯廷教堂被《创世纪》征服。傍晚在圣天使桥看日落。' },
      accommodation: { sameAsPrevious: true, city: '罗马', address: 'Via Montebello, 109' },
      tips: { items: [], packingList: [] },
      locations: [
        { name: '圣彼得大教堂', nameIt: "St. Peter's Basilica", hours: '7:00-18:00', cost: '免费(登顶收费)', tags: ['景点'], duration: '2h', tips: '先看《圣殇》、青铜华盖、穹顶', intro: '世界上最大的教堂，建于1506年，历时120年完工。米开朗基罗24岁时创作的《圣殇》是文艺复兴雕塑的巅峰之作；贝尔尼尼设计的青铜华盖高29米，正对祭坛；穹顶直径42米，可登顶俯瞰整个罗马城。', lat: 41.9022, lng: 12.4539, order: 1 },
        { name: '梵蒂冈博物馆', nameIt: 'Vatican Museums', hours: '预约17:30', cost: '免费日(最后周日)', tags: ['景点'], duration: '4h', tips: '禁止穿短裤露肩装；带小镜子拍天顶画', intro: '收藏了教皇数百年积累的无价艺术珍品。西斯廷教堂内米开朗基罗的《创世纪》天顶画和《最后的审判》是西方艺术的巅峰；拉斐尔画室的《雅典学院》汇聚了古希腊哲学家的群像；《拉奥孔》等古希腊雕塑同样震撼人心。', lat: 41.9065, lng: 12.4536, order: 2 },
        { name: '圣天使桥&圣天使堡', nameIt: 'Castel Sant\'Angelo', hours: '24h(桥)', cost: '免费(桥)', tags: ['景点'], duration: '30min', tips: '晚上天黑后去', intro: '建于公元139年的古罗马桥梁，桥上矗立着12座巴洛克风格的天使雕像，每座天使手持与耶稣受难相关的器具。圣天使堡原为哈德良皇帝的陵墓，后改为城堡和博物馆。夜晚灯光映照下，桥与城堡倒映在台伯河中，景色绝美。', lat: 41.9030, lng: 12.4660, order: 3 },
      ],
      transport: { intercity: [], intracity: [{ mode: '地铁/步行', details: '能走路就别坐车，不要买日票' }] },
    }) },
    { id: 11, day_number: 11, date: '10/4', weekday: '周日', city: '罗马', city_en: 'Roma', sort_order: 11, content_json: JSON.stringify({
      overview: { text: '旅程最后一天，献给古罗马的荣光。万神殿的光束、斗兽场的震撼，为千年之旅画上句点。' },
      accommodation: { sameAsPrevious: true, city: '罗马', address: 'Via Montebello, 109' },
      tips: { items: [], packingList: [] },
      locations: [
        { name: '万神殿', nameIt: 'Pantheon', hours: '09:00-19:00', cost: '7€', tags: ['景点'], duration: '1h', tips: '八点半排队，排最左边的队', intro: '建于公元125年的古罗马神庙，穹顶直径43.4米，是古罗马建筑的巅峰之作。顶部直径8.9米的圆洞是唯一光源，阳光射入形成神圣的光柱。拉斐尔等名人安葬于此。穹顶比例完美，至今仍是建筑史上的奇迹。', lat: 41.8986, lng: 12.4769, order: 1 },
        { name: '特莱维喷泉', nameIt: 'Trevi Fountain', hours: '24h', cost: '2€', tags: ['景点'], duration: '30min', tips: '距万神殿步行600m', intro: '罗马最大的巴洛克风格喷泉，高26米，宽20米。传说背对喷泉投一枚硬币会重返罗马，投两枚会遇到爱情，投三枚会结婚。每天约有3000欧元硬币被投入池中，全部捐赠给慈善机构。', lat: 41.9009, lng: 12.4833, order: 2 },
        { name: '博尔盖塞美术馆', nameIt: 'Galleria Borghese', cost: '免费日(第一个周日)', tags: ['景点'], duration: '2h', intro: '收藏了贝尔尼尼的巅峰雕塑作品。《被劫持的普洛塞庇娜》中冥王手指陷入少女大腿的大理石质感令人惊叹；《阿波罗与达芙妮》定格了少女化为月桂树的瞬间；《大卫》展现了战斗前紧绷的瞬间，比米开朗基罗的版本更具动感。', lat: 41.9142, lng: 12.4942, order: 3 },
        { name: '罗马斗兽场', nameIt: 'Colosseum', hours: '8:30-19:15', cost: '通票18€', tags: ['景点'], duration: '3h', tips: '14:00后到，门口领三联票', intro: '建于公元72-80年的巨型椭圆形竞技场，是古罗马文明的象征。曾容纳5-9万名观众观看角斗士比赛、野兽狩猎和处决表演。地下迷宫和升降系统展现了古罗马的工程智慧。通票包含古罗马广场和帕拉蒂尼山。', lat: 41.8902, lng: 12.4922, order: 4 },
      ],
      transport: { intercity: [], intracity: [{ mode: '地铁/步行', details: '能走路就别坐车' }] },
    }) },
  ];
  writeStore('days', daysData);

  // Expenses
  const expensesData: ExpenseRecord[] = [
    { id: nextId(), date: '9/24', category: '交通', sub_category: '巴勒莫机场→市区', amount: 6.8, currency: 'EUR', split_count: 6, per_person: 1.13, note: '火车票' },
    { id: nextId(), date: '9/24-25', category: '住宿', sub_category: '巴勒莫公寓', amount: 1791.54, currency: 'EUR', split_count: 6, per_person: 298.59, note: '详见飞书' },
    { id: nextId(), date: '9/24', category: '餐饮', sub_category: 'Ballarò市场', amount: 50, currency: 'EUR', split_count: 6, per_person: 8.33, note: '人均消费' },
    { id: nextId(), date: '9/25', category: '交通', sub_category: '巴勒莫→陶尔米纳', amount: 20, currency: 'EUR', split_count: 6, per_person: 3.33, note: '大巴换乘2次' },
    { id: nextId(), date: '9/26', category: '交通', sub_category: '贝拉岛缆车', amount: 10, currency: 'EUR', split_count: 6, per_person: 1.67, note: '往返' },
    { id: nextId(), date: '9/27', category: '交通', sub_category: '陶尔米纳→锡拉库萨', amount: 80, currency: 'RMB', split_count: 6, per_person: 13.33, note: '火车往返' },
    { id: nextId(), date: '9/28', category: '交通', sub_category: '过夜火车→那不勒斯', amount: 50, currency: 'EUR', split_count: 6, per_person: 8.33, note: '估算' },
    { id: nextId(), date: '9/29', category: '交通', sub_category: '那不勒斯→索伦托', amount: 4.6, currency: 'EUR', split_count: 6, per_person: 0.77, note: '近郊火车' },
    { id: nextId(), date: '9/29', category: '其他', sub_category: '那不勒斯行李寄存', amount: 5, currency: 'EUR', split_count: 6, per_person: 0.83, note: '每件/自然日' },
    { id: nextId(), date: '9/30', category: '门票', sub_category: '圣塞维诺小堂', amount: 12, currency: 'EUR', split_count: 6, per_person: 2, note: '需预约' },
    { id: nextId(), date: '10/1', category: '门票', sub_category: '庞贝古城', amount: 500, currency: 'RMB', split_count: 6, per_person: 83.33, note: '含讲解' },
    { id: nextId(), date: '10/3', category: '门票', sub_category: '梵蒂冈博物馆', amount: 0, currency: 'EUR', split_count: 6, per_person: 0, note: '免费日' },
    { id: nextId(), date: '10/4', category: '门票', sub_category: '博尔盖塞美术馆', amount: 0, currency: 'EUR', split_count: 6, per_person: 0, note: '免费日' },
    { id: nextId(), date: '10/4', category: '门票', sub_category: '罗马斗兽场', amount: 18, currency: 'EUR', split_count: 6, per_person: 3, note: '通票' },
  ];
  writeStore('expenses', expensesData);

  // Checklist
  const checklistData: ChecklistRecord[] = [
    '护照', '现金（欧元）', '信用卡（Visa/Mastercard）', '充电宝',
    '转换插头', '雨伞', '墨镜', '防晒霜', '披肩外套', '相机', '常用药品', '洗漱用品',
  ].map((label, i) => ({ id: nextId(), label, checked: 0, sort_order: i + 1 }));
  writeStore('checklist', checklistData);

  // Bookings
  const bookingsData: BookingRecord[] = [
    { id: nextId(), city: '巴勒莫', date: '9/24', attraction: '诺曼王宫&帕拉蒂尼礼拜堂', price: '19€', need_reservation: 1, booking_link: '', note: '建议预约', sort_order: 1 },
    { id: nextId(), city: '那不勒斯', date: '9/30', attraction: '圣塞维诺小堂', price: '12€', need_reservation: 1, booking_link: '', note: '必须提前官网预约，提前两天会再放一次票', sort_order: 2 },
    { id: nextId(), city: '庞贝', date: '10/1', attraction: '庞贝古城', price: '500 RMB', need_reservation: 0, booking_link: '', note: '已含讲解', sort_order: 3 },
    { id: nextId(), city: '罗马', date: '10/3', attraction: '梵蒂冈博物馆', price: '25€（免费日0€）', need_reservation: 1, booking_link: '', note: '每月最后一个周日免费', sort_order: 4 },
    { id: nextId(), city: '罗马', date: '10/4', attraction: '博尔盖塞美术馆', price: '免费日0€', need_reservation: 1, booking_link: '', note: '每月第一个周日免费，仍需网上预约', sort_order: 5 },
    { id: nextId(), city: '罗马', date: '10/4', attraction: '罗马斗兽场', price: '通票18€', need_reservation: 1, booking_link: '', note: '可使用Roma Pass', sort_order: 6 },
  ];
  writeStore('bookings', bookingsData);

  console.log('Database seeded successfully');
}
