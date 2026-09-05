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
  category: string;
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
    start_date: '2026-09-23',
    end_date: '2026-10-06',
    cities: ['北京', '巴勒莫', '陶尔米纳', '锡拉库萨', '那不勒斯', '庞贝', '罗马'],
    hand_drawn_map_url: '',
    notices: {
      transport: [
        '火车纸质票上车前必须自行检票打卡。建议将票紧贴打票机最左侧插入，成功时机器亮绿灯，同时检查票上是否有打票印记',
        '出行前均需提前一天确认火车时刻，意大利火车延误或提前发车风险较大',
        '需提前30分钟抵达火车站',
      ],
      travel: [
        '防盗！防盗！防盗！手机握手里，包包放怀里',
        '带水、带伞、带纸巾、带现金。意大利喝水要钱、上厕所要钱',
      ],
      daily: [
        '意大利大部分自来水为硬水，可尝试公共直饮水点，建议烧水或购买瓶装水。瓶装水分两种：Naturale（无气）和Frizzante（有气）',
      ],
    },
    flights: {
      outbound: {
        date: '9/24',
        segments: [
          { leg: '第一段', from: '北京 00:10', to: '伊斯坦布尔 05:30', duration: '10.5h', airline: '土耳其航空 TK89', airport: '北京首都T1' },
          { leg: '中转', from: '—', to: '—', duration: '1.5h', airline: '—', airport: '伊斯坦布尔机场' },
          { leg: '第二段', from: '伊斯坦布尔 06:50', to: '巴勒莫 08:25', duration: '2.5h', airline: '土耳其航空 TK1373', airport: '—' },
        ],
        tips: [
          '提前24h通过土耳其航空官网或APP提前选座（免费值机为随机选座，指定座位需付费）',
          '托运时要求箱子贴上"优先"贴纸，确认是否可以正常中转',
          '中转时间很短（1.5h），下飞机后需快速前往转机，注意门口站着指引的地勤',
          '第二段出海关时不能太慢，最好亲眼等到行李出来',
        ],
      },
      inbound: {
        date: '10/5-10/6',
        segments: [
          { leg: '第一段', from: '罗马 14:55', to: '法兰克福 16:55', duration: '2h', airline: '汉莎航空 LH235', airport: '罗马 Fiumicino T1' },
          { leg: '中转', from: '—', to: '—', duration: '3h', airline: '—', airport: '法兰克福机场' },
          { leg: '第二段', from: '法兰克福 19:50', to: '北京 11:15(+1)', duration: '9.5h', airline: '国航 CA932', airport: '—' },
        ],
        tips: [
          '坐罗马机场快线到机场：在谷歌地图导航"Roma Termini"，寻找标有"FERMATA BUS STOP"的红色1号车牌',
          '值机时确认行李是否可直挂北京',
        ],
      },
    },
  };
  writeStore('trip_info', tripInfo);

  // Day 1: Palermo
  const day1: DayRecord = {
    id: 1, day_number: 1, date: '9/24', weekday: '周四', city: '巴勒莫', city_en: 'Palermo', sort_order: 1,
    content_json: JSON.stringify({
      overview: { text: '意大利旅游正式开始，从美丽的西西里岛首府巴勒莫出发吧！去深刻感受这座衰败与辉煌并存的城市吧。', cityIntro: '巴勒莫——意大利西西里岛的首府，一座衰败与辉煌并存的城市。巴勒莫拥有超2700年的历史，曾是一个阿拉伯酋长国（9世纪），也曾是诺曼王国的首府（12世纪），并因此催生出"阿拉伯-诺曼风格"建筑。' },
      accommodation: { city: '巴勒莫', checkIn: '9/24-9/25，入住15:00，退房10:00', address: 'Via delle Pergole, 60, Palermo, Sicilia 90134, Italy', condition: '整租公寓，3间卧室，1间卫生间，1张双人床+3张单人床+1张沙发床', checkInMethod: '钥匙盒', lat: 38.1157, lng: 13.3615 },
      tips: { items: ['出海关冲前面盯行李，防止行李丢失', '因为下午才能办理入住，需先行李寄存，导航 CoverCity Palermo，5€/箱'], packingList: ['披肩外套', '墨镜', '防晒霜', '雨伞', '充电宝', '护照', '现金', '相机'] },
      locations: [
        { name: '巴勒莫市场', nameIt: 'Ballarò', hours: '10:30-17:00', cost: '50€', tags: ['美食'], duration: '2h', tips: '一大早就去，一定要带现金；一定要吃牛肚包Pane con la milza（寻找路线见小红书链接）、炸饭团Arancino、炸小吃Frittula', intro: '脾脏面包：牛脾和牛肺，搭配卡其卡瓦洛奶酪和柠檬夹在面包里。如果加了其他配料则称为"maritatu"（已婚），否则称为"maritatu"（未婚）。巴勒莫最地道的街头美食体验。', lat: 38.1115, lng: 13.3645, order: 1 },
        { name: '巴勒莫耶稣堂', nameIt: 'Chiesa del Gesu', hours: '9:00-18:30', cost: '2€', tags: ['景点'], duration: '1h', tips: '现场买门票，门票2€，博物馆6€但不用去', intro: '最初教堂设计为单中殿结构，并在右侧设置深进式礼拜堂。16-17世纪进行改造并确定沿用至今的空间形态，遵循反宗教改革原则即信众可更近距离参与仪式。内部装饰极尽奢华，大理石镶嵌工艺令人叹为观止。', lat: 38.1123, lng: 13.3598, order: 2 },
        { name: '诺曼王宫&帕拉蒂尼礼拜堂', nameIt: 'Palazzo dei Normanni & Cappella Palatina', hours: '8:30-16:30', cost: '19€', tags: ['景点'], duration: '2h', tips: '先冲2楼礼拜堂可以错开人流；不得穿着暴露，门口有卖毯子但贵', intro: '建于12世纪诺曼王朝时期，曾是西西里国王的宫殿。礼拜堂是12世纪罗杰二世下令修建，由四种风格的工匠各自修建却浑然天成：拜占庭马赛克、阿拉伯拱门、诺曼底结构、拉丁平面，堪称文化融合典范。', lat: 38.1105, lng: 13.3537, order: 3 },
        { name: '巴勒莫主教堂', nameIt: 'Cattedrale di Palermo', hours: '7:00-19:00', cost: '免费', tags: ['景点'], duration: '1h', tips: '主殿免费，登顶7€', intro: '世界文化遗产"阿拉伯-诺曼风格"的核心组成，其独特在于"不同文化（拜占庭、伊斯兰、拉丁、犹太）相互碰撞产生的杰出艺术创造"。教堂融合了多种建筑风格，是巴勒莫最具标志性的建筑。', lat: 38.1157, lng: 13.3615, order: 4 },
        { name: '马西莫剧院', nameIt: 'Teatro Massimo di Palermo', hours: '', cost: '免费', tags: ['景点'], duration: '10min', tips: '在外面路过一下就可以了', intro: '意大利最大的歌剧院，也是欧洲第三大歌剧院（仅次于巴黎歌剧院和维也纳国家歌剧院）。以完美的音响效果著称，建筑风格为新古典主义，外观宏伟壮观。', lat: 38.1148, lng: 13.3575, order: 5 },
        { name: '意大利菜', nameIt: 'Trattoria del Massimo', hours: '09:00-15:30 / 18:30-23:00', cost: '20€', tags: ['美食'], duration: '', tips: '安排在晚饭，去马西莫剧院时品鉴一下；必点西西里红虾面 Busiata Pesto Siciliano e Gambero', intro: '', lat: 38.1148, lng: 13.3572, order: 6 },
        { name: '四角广场', nameIt: 'Quattro Canti', hours: '', cost: '免费', tags: ['景点'], duration: '30min', tips: '每一角的喷泉雕像，代表着四季、西西里四位国王和守护者。会有小惊喜：广场上多站一会就会收到印有自己照片的报纸', intro: '', lat: 38.1145, lng: 13.3600, order: 7 },
        { name: '普雷托利亚喷泉', nameIt: 'Fontana Pretoria', hours: '维修中', cost: '免费', tags: ['景点'], duration: '10min', tips: '在外面路过一下就可以了', intro: '以裸体雕塑闻名，原本建于1554年，为佛罗伦萨一位贵族设计的私人花园喷泉。1574年巴勒莫市政府将其买下并拆解运回西西里，重新组装于此。雕塑精美绝伦，是文艺复兴时期的杰作。', lat: 38.1148, lng: 13.3605, order: 8 },
        { name: 'Ganci面包店', nameIt: 'Rosticceria da Ganci', hours: '24h', cost: '2€', tags: ['美食'], duration: '', tips: '面包只要1€，还是24小时营业，多买多吃，强推肉酱炸饭团；靠近巴勒莫车站，建议9/25早上去买', intro: '', lat: 38.1165, lng: 13.3640, order: 9 },
      ],
      transport: { intercity: [{ desc: '巴勒莫机场 → 巴勒莫市区', duration: '1h', cost: '6.8€', departure: 'Palermo Aeroporto', departureLat: 38.1790, departureLng: 13.2450, time: '', tips: '现场购票；跟随橙色指示牌"TRENI train station"到售票地点' }], intracity: [{ mode: '公交车', details: '车票不分车次，为通用票；上车需在打票机上打票，磁条面朝下放入打票机；打票后车票90min内有效，可以转车，超过90min仍在车上有被查票罚款风险' }] }
    })
  };

  // Day 2: Taormina
  const day2: DayRecord = {
    id: 2, day_number: 2, date: '9/25', weekday: '周五', city: '陶尔米纳', city_en: 'Taormina', sort_order: 2,
    content_json: JSON.stringify({
      overview: { text: '前往"西西里阳台"陶尔米纳，当埃特纳火山与爱奥尼亚海同时映入眼帘，便可以明白它为何是贵族的避世胜地。将在陶尔米纳小城停留4天，中间可自由选择前往锡拉库萨或埃特纳火山。', cityIntro: '陶尔米纳坐落于西西里岛东岸、海拔约200米的悬崖山脊之上，地处墨西拿与卡塔尼亚之间，面朝澄澈的爱奥尼亚海，背靠欧洲最大活火山埃特纳。整座小城依山而建，人口仅万人左右，自古是贵族、艺术家的避世胜地，歌德、王尔德、莫泊桑都曾在此留下文字。' },
      accommodation: { city: '陶尔米纳', checkIn: '9/25-9/26，入住14:00，退房10:00', address: 'Via Otto Geleng, 75', condition: '整租公寓85㎡，2间卧室，1间卫生间，2张双人床，1张沙发床', checkInMethod: '暂无', lat: 37.8525, lng: 15.2833 },
      tips: { items: ['重点位置：火车站Taormina Giardini（山下）、公交车站Taormina Terminal Bus（山上）、市中心Taormina Centro（山上）', '晚饭待定（需寻找餐厅）'], packingList: [] },
      locations: [
        { name: 'Parco Trevelyan', nameIt: 'Parco Trevelyan', hours: '8:00-20:00', cost: '免费', tags: ['景点'], duration: '30min', tips: '', intro: '可以俯瞰西西里，欣赏到埃特纳火山和纳克索斯湾的壮丽景色。园内有特列威廉夫人设计的奇特塔楼建筑', lat: 37.8530, lng: 15.2840, order: 1 },
      ],
      transport: { intercity: [{ desc: '巴勒莫 → 陶尔米纳', duration: '5h', cost: '20€', departure: 'Palermo Via Tommaso Fazello', departureLat: 38.1165, departureLng: 13.3640, time: '9:00-12:00半小时一班', tips: '第一程：巴勒莫 → 卡塔尼亚（SAIS/Interbus/Flixbus，现场买票）；第二程：卡塔尼亚 → 陶尔米纳（Interbus，现场买票或APP买票，6:00-20:00半小时一班）；坐第二层第一排左侧可以看到海景' }], intracity: [] }
    })
  };

  // Day 3: Taormina (Isola Bella)
  const day3: DayRecord = {
    id: 3, day_number: 3, date: '9/26', weekday: '周六', city: '陶尔米纳', city_en: 'Taormina', sort_order: 3,
    content_json: JSON.stringify({
      overview: { text: '贝拉岛将是今天最重要的行程，俯瞰这座爱心状的小岛，漫步在洁白的沙滩上，不要忘了带上溯溪鞋和浴巾，也许可以趁着退潮走上这座曾经是贵族所有的岛屿。', cityIntro: '' },
      accommodation: { city: '陶尔米纳', checkIn: '9/26-9/28，入住15:00，退房10:00', address: 'Via Giuseppe di Vittorio, 16, Taormina, Sicilia 98039, Italy', condition: '整租公寓，2间卧室，2间卫生间，1张双人床+2张单人床+1张沙发床', checkInMethod: '通过大楼员工协助自助入住', lat: 37.8520, lng: 15.2830 },
      tips: { items: ['提前和房东备注需要6人入住，房间均配备双人床', '需缴纳住宿税1€/人/天', '抵达公寓需要爬60m陡坡'], packingList: ['泳衣', '浴巾', '溯溪鞋', '墨镜', '防晒霜', '雨伞', '充电宝', '护照', '现金', '相机'] },
      locations: [
        { name: '贝拉岛观景平台', nameIt: 'Belvedere di Via Pirandello', hours: '24h', cost: '免费', tags: ['景点'], duration: '1h', tips: '', intro: '俯瞰Isola Bella爱心小岛的最佳机位，路上还会经过Villa Comunale di Taormina皇家花园', lat: 37.8495, lng: 15.2855, order: 1 },
        { name: '贝拉岛', nameIt: 'Isola Bella', hours: '24h', cost: '免费', tags: ['景点'], duration: '2h', tips: '推荐退潮时去，备好溯溪鞋或者洞洞鞋；可参考小红书攻略坐船上岛，或退潮时走到岛上，或躺在沙滩上', intro: '', lat: 37.8485, lng: 15.2870, order: 2 },
      ],
      transport: { intercity: [], intracity: [{ mode: '缆车', details: '缆车单程6€，往返10€，可抵达Isola Bella/海滩。上车站：Via Pirandello 22, Taormina', stationLat: 37.8495, stationLng: 15.2855 }] }
    })
  };

  // Day 4: Siracusa
  const day4: DayRecord = {
    id: 4, day_number: 4, date: '9/27', weekday: '周日', city: '锡拉库萨', city_en: 'Siracusa', sort_order: 4,
    content_json: JSON.stringify({
      overview: { text: '探访锡拉库萨，比罗马更加古老的希腊遗迹，奥提伽岛将是今天最重要的行程。', cityIntro: '' },
      accommodation: { city: '锡拉库萨', checkIn: '同前日住宿（陶尔米纳）', address: 'Via Giuseppe di Vittorio, 16', condition: '', checkInMethod: '', lat: 37.0745, lng: 15.2855 },
      tips: { items: [], packingList: [] },
      locations: [
        { name: '阿波罗神庙', nameIt: 'Tempio di Apollo', hours: '', cost: '免费', tags: ['景点'], duration: '1h', tips: '', intro: '锡拉库扎最古老的希腊遗迹', lat: 37.0625, lng: 15.2915, order: 1 },
        { name: '锡拉库萨教堂广场', nameIt: 'Piazza del Duomo', hours: '', cost: '2€（门票）', tags: ['景点'], duration: '1h', tips: '', intro: '', lat: 37.0620, lng: 15.2925, order: 2 },
        { name: '马尼亚切城堡', nameIt: 'Maniace Castle', hours: '', cost: '5€（门票）', tags: ['景点'], duration: '1h', tips: '', intro: '马尼亚切城堡是座独一无二的中世纪海防建筑：腓特烈二世留存极少的海边皇家堡垒', lat: 37.0585, lng: 15.2965, order: 3 },
      ],
      transport: { intercity: [{ desc: '陶尔米纳 → 锡拉库萨', duration: '2h', cost: '80 RMB', departure: 'Taormina-Giardini火车站', departureLat: 37.8480, departureLng: 15.2810, time: '10:00-11:57', tips: '现场购票/提前网上购票；坐在左侧可看到海景' }], intracity: [{ mode: '公交车', details: '公共交通为红色面包车，需招手停车；巴士票提前官网买（1.2€/次或1.5€/90min），目的地为奥提伽岛Ortigia' }] }
    })
  };

  // Day 5: Taormina
  const day5: DayRecord = {
    id: 5, day_number: 5, date: '9/28', weekday: '周一', city: '陶尔米纳', city_en: 'Taormina', sort_order: 5,
    content_json: JSON.stringify({
      overview: { text: '今天将继续在陶尔米纳的街道上漫步，夜幕降临时，搭乘过夜火车告别西西里。', cityIntro: '' },
      accommodation: { city: '无住宿', checkIn: '乘坐过夜火车', address: '', condition: '', checkInMethod: '', lat: 0, lng: 0 },
      tips: { items: ['重点位置：火车站Taormina Giardini（山下）、公交车站Taormina Terminal Bus（山上）、市中心Taormina Centro（山上）', '待办事项：①今天需10:00退房，退房后至23:00乘车间需行李寄存在火车站附近，注意晚22:00左右是否可取；②关注下山抵达火车站的巴士末班车'], packingList: [] },
      locations: [
        { name: '古希腊罗马剧场', nameIt: 'Teatro Greco', hours: '8:00-20:00', cost: '17€', tags: ['景点'], duration: '30min', tips: '', intro: '下午临近夕阳去（但看上去也一般），西西里第二大古剧场，始建于公元前3世纪，罗马时期大规模修缮', lat: 37.8535, lng: 15.2845, order: 1 },
        { name: '翁贝托一世街', nameIt: 'Corso Umberto', hours: '10:00-21:00', cost: '不定', tags: ['购物'], duration: '2h', tips: '', intro: '奢侈品、手信、咖啡馆应有尽有。尽头的Dior店非常漂亮。人头陶瓷花盆：很久以前，巴勒莫一个女孩爱上了一个阿拉伯男子，但他已有了妻儿并准备离开西西里，疯狂的女孩砍下了他的头做成花盆，从此这个图案成为西西里的象征', lat: 37.8528, lng: 15.2838, order: 2 },
        { name: '四月九日广场', nameIt: 'Piazza IX Aprile', hours: '24h', cost: '不定', tags: ['购物'], duration: '1h', tips: '', intro: '陶尔米纳的市中心，有着漂亮的街景和历史悠久的教堂', lat: 37.8532, lng: 15.2842, order: 3 },
      ],
      transport: { intercity: [{ desc: '陶尔米纳 → 那不勒斯（过夜火车）', duration: '约10h', cost: '50€+', departure: 'Taormina-Giardini火车站', departureLat: 37.8480, departureLng: 15.2810, time: '23:35 - 07:42(+1)', tips: '①提前邮箱核实出发时间；②分为四人间和双人间，均为公共卫生间；③下车前收拾出带去索伦托的背包' }], intracity: [] }
    })
  };

  // Day 6: Sorrento
  const day6: DayRecord = {
    id: 6, day_number: 6, date: '9/29', weekday: '周二', city: '索伦托', city_en: 'Sorrento', sort_order: 6,
    content_json: JSON.stringify({
      overview: { text: '清晨乘火车抵达那不勒斯，存好行李后，随即前往索伦托，探访"乔瓦娜秘境"，在悬崖下的天然泳池中，享受果冻般碧绿的海水。也可以在索伦托的小镇上，感受闲适随性的南意生活。', cityIntro: '' },
      accommodation: { city: '那不勒斯', checkIn: '9/29-10/2，入住15:00，退房10:00', address: 'Vico Giganti, 55, Naples, Campania 80138', condition: '整租公寓，4间卧室，4间卫生间，4张双人床+2张单人床', checkInMethod: '暂无', lat: 40.8515, lng: 14.2690 },
      tips: { items: ['公寓在4楼，没有电梯', '晚22:30后入住需额外支付10€', '退房时带走垃圾', '抵达那不勒斯后，寄存行李 deposito bagagli，华人老板，微信联系naples-datang，5€/件/自然日', '考虑是否参与爱彼迎的桨板体验划到乔瓦娜秘境，390 RMB/人，推荐抵达索伦托就去，十一温度会比较冷'], packingList: ['泳衣', '浴巾', '溯溪鞋', '墨镜', '防晒霜', '雨伞', '充电宝', '护照', '现金', '相机'] },
      locations: [
        { name: '乔瓦娜秘境', nameIt: 'Capo di Sorrento', hours: '24h', cost: '免费', tags: ['景点'], duration: '3h', tips: '中午去天然果冻海泳池游泳，带泳衣浴巾和一些食物和水；那不勒斯抵达秘境只需换乘2次，约2h', intro: '', lat: 40.6260, lng: 14.3760, order: 1 },
      ],
      transport: { intercity: [{ desc: '那不勒斯 → 索伦托', duration: '1h', cost: '4.6€', departure: 'Napoli Porta Nolana火车站', departureLat: 40.8525, departureLng: 14.2730, time: '', tips: '现场购票；乘坐近郊火车Circumvesuviana，沿路找该标识。此站为始发站，人少有座；一般去索伦托方向为站台1，站台屏幕方向为车头，在车头处登车是座椅车厢' }], intracity: [{ mode: '公交车', details: 'App购票（UnicoCampania）/ 车站售票点买票 / 上车买票（部分公交EAV）' }] }
    })
  };

  // Day 7: Naples
  const day7: DayRecord = {
    id: 7, day_number: 7, date: '9/30', weekday: '周三', city: '那不勒斯', city_en: 'Naples', sort_order: 7,
    content_json: JSON.stringify({
      overview: { text: '回到那不勒斯，在上午去圣塞维诺小堂见证《蒙面纱的耶稣》这一艺术奇迹。傍晚，登上圣埃莫堡，看夕阳将那不勒斯密密麻麻的红色屋顶染成金色，感受混乱与壮丽交织的城市之美。', cityIntro: '' },
      accommodation: { city: '那不勒斯', checkIn: '同前日住宿', address: 'Vico Giganti, 55', condition: '', checkInMethod: '', lat: 40.8515, lng: 14.2690 },
      tips: { items: [], packingList: ['披肩外套', '墨镜', '防晒霜', '雨伞', '充电宝', '护照', '现金', '相机'] },
      locations: [
        { name: '圣塞维诺小堂', nameIt: 'Museo Cappella Sansevero', hours: '预约10:30', cost: '12€', tags: ['景点'], duration: '2h', tips: '①参观前先到Ticket Office兑换纸质票（因为非常好看！）；②礼拜堂内禁止拍照录像', intro: '礼拜堂是雷蒙多·迪·桑格罗亲王打造的。必看镇馆三杰：1.《蒙面纱的耶稣》（Cristo Velati）——雕塑主题是死去的基督，覆盖在身上的薄纱象征死亡并非终点', lat: 40.8475, lng: 14.2535, order: 1 },
        { name: '圣埃莫堡', nameIt: "Castel Sant'Elmo", hours: '预约17:00', cost: '正常5€，16:00后2.5€', tags: ['景点'], duration: '2h', tips: '①一定要在18:30前进城堡，超时进不来；②来这里看日落，爬到山顶往山下看，会有非常震撼的红房顶景色', intro: '圣埃莫堡位于沃梅罗（Vomero）山顶，与圣玛蒂诺修道院相邻，是一座星形的军事堡垒。始建于14世纪，曾作为军事要塞、监狱，现为国家博物馆。堡内保留破旧教堂、大炮', lat: 40.8455, lng: 14.2425, order: 2 },
        { name: '披萨', nameIt: "Spizzuliann pe' Toledo", hours: '', cost: '', tags: ['美食'], duration: '', tips: '', intro: '', lat: 40.8460, lng: 14.2480, order: 3 },
        { name: '手工皮具店', nameIt: 'Scriptura', hours: '', cost: '', tags: ['购物'], duration: '', tips: '', intro: '', lat: 40.8470, lng: 14.2530, order: 4 },
      ],
      transport: { intercity: [], intracity: [{ mode: '地铁Metro / 缆车Funicolare', details: '购票方式：刷感应式信用卡/手机过闸。如买纸质票，可在地铁站自动售票机或街边烟草店（Tabacchi）购买。Tips：①纸质票务必打票，被查到没打票将面临高额罚款，纸质票只需进站打卡；②刷卡或手机出入站均需刷卡，使用ApplePay需先双击刷脸再在机器上刷卡' }] }
    })
  };

  // Day 8: Pompeii
  const day8: DayRecord = {
    id: 8, day_number: 8, date: '10/1', weekday: '周四', city: '庞贝', city_en: 'Pompeii', sort_order: 8,
    content_json: JSON.stringify({
      overview: { text: '前往庞贝古城，漫步在公元79年的街道上。面包房、角斗场、壁画……一切都被火山灰定格。', cityIntro: '' },
      accommodation: { city: '那不勒斯', checkIn: '同前日住宿', address: 'Vico Giganti, 55', condition: '', checkInMethod: '', lat: 40.8515, lng: 14.2690 },
      tips: { items: [], packingList: ['食物', '水', '墨镜', '防晒霜', '雨伞', '充电宝', '护照', '现金', '相机'] },
      locations: [
        { name: '庞贝古城', nameIt: 'Pompeii', hours: '预约10:00', cost: '500 RMB', tags: ['景点'], duration: '4h', tips: '', intro: '公元79年因维苏威火山爆发被瞬间掩埋，也因此完整保存了古罗马城市的街道、建筑和生活场景。可以看到著名的市政广场、大剧院、角斗场以及令人震撼的"石膏铸像"。庞贝 not just a ruin, but a time capsule.', lat: 40.7505, lng: 14.4865, order: 1 },
      ],
      transport: { intercity: [{ desc: '那不勒斯 → 庞贝', duration: '30min', cost: '3.3€', departure: 'Napoli Porta Nolana火车站', departureLat: 40.8525, departureLng: 14.2730, time: '', tips: '现场购票；目的地买票到Pompei Scavi – Villa dei Misteri站' }], intracity: [] }
    })
  };

  // Day 9: Naples → Rome
  const day9: DayRecord = {
    id: 9, day_number: 9, date: '10/2', weekday: '周五', city: '那不勒斯→罗马', city_en: 'Naples → Rome', sort_order: 9,
    content_json: JSON.stringify({
      overview: { text: '吃完早饭步行去那不勒斯主教堂和这座城市告别，中午将抵达罗马，初遇"永恒之城"。', cityIntro: '' },
      accommodation: { city: '罗马', checkIn: '10/2-10/5，入住15:00，退房11:00', address: 'Via Montebello, 109, 00185 Roma RM', condition: '整租公寓，2间卧室，1间卫生间，2张双人床+1张沙发床', checkInMethod: '密码锁', lat: 41.9100, lng: 12.4960 },
      tips: { items: ['11:00退房前逛完那不勒斯主教堂回来，就不用存行李了', '抵达罗马后，询问房东是否可以提前存放行李，如不行不如带着行李去吃午饭，再等待15:00办理入住'], packingList: [] },
      locations: [
        { name: '那不勒斯主教堂', nameIt: 'Duomo di Napoli', hours: '10:00-17:00，周三闭馆', cost: '免费，博物馆13€', tags: ['景点'], duration: '1h', tips: '', intro: '教堂原名圣母升天大主教座堂，是城市守护神圣雅纳略的圣地。意大利每座城市都有自己的守护神，罗马有圣彼得，那不勒斯有圣雅纳略。公元305年圣雅纳略被斩首殉道，他的血液被保存在教堂中', lat: 40.8540, lng: 14.2630, order: 1 },
        { name: '圣依纳爵堂', nameIt: 'Piazza S. Ignazio', hours: '9:00-23:30', cost: '免费', tags: ['景点'], duration: '1h', tips: '晚上去人少，看假穹顶天顶画', intro: '教堂始建于17世纪，为纪念耶稣会创始人圣伊纳爵而建。最震撼的是其天顶画，描绘《圣伊纳爵在天国受到基督和圣母的欢迎》。当时由于资金不足以建造穹顶，艺术家使用透视法绘制出逼真的穹顶效果', lat: 41.8995, lng: 12.4780, order: 2 },
      ],
      transport: { intercity: [{ desc: '那不勒斯 → 罗马', duration: '1h', cost: '30€+', departure: 'Napoli Centrale火车站', departureLat: 40.8535, departureLng: 14.2735, time: '', tips: 'Trenitalia/Italo高铁，建议提前网上购票' }], intracity: [{ mode: '同Day 7那不勒斯交通', details: '地铁Metro/缆车Funicolare' }] }
    })
  };

  // Day 10: Vatican
  const day10: DayRecord = {
    id: 10, day_number: 10, date: '10/3', weekday: '周六', city: '梵蒂冈', city_en: 'Vatican', sort_order: 10,
    content_json: JSON.stringify({
      overview: { text: '梵蒂冈是今天的主题。在圣彼得大教堂仰望米开朗基罗的穹顶。随后在梵蒂冈博物馆，直至在西斯廷教堂被《创世纪》彻底征服。傍晚，在圣天使桥看台伯河日落。', cityIntro: '' },
      accommodation: { city: '罗马', checkIn: '同前日住宿', address: 'Via Montebello, 109', condition: '', checkInMethod: '', lat: 41.9100, lng: 12.4960 },
      tips: { items: ['能坐地铁就别坐公交，能走路就别坐车，不要买日票', '其他同那不勒斯交通方式'], packingList: [] },
      locations: [
        { name: '圣彼得大教堂', nameIt: "St. Peter's Basilica", hours: '7:00-18:00', cost: '免费，登顶收费', tags: ['景点'], duration: '2h', tips: '先看米开朗基罗《圣殇》、贝尔尼尼青铜华盖、穹顶', intro: '始建于1506年，历时120年完工，汇聚布拉曼特、米开朗基罗、贝尔尼尼等大师心血。天主教最重要的圣地之一，据传圣彼得（耶稣大弟子）葬于此。1.米开朗基罗的《圣殇》：进门右手边第一座小堂，米开朗基罗唯一签名的作品', lat: 41.9022, lng: 12.4539, order: 1 },
        { name: '梵蒂冈博物馆', nameIt: 'Vatican Museums', hours: '预约17:30', cost: '免费日（每月最后一个周日免费）', tags: ['景点'], duration: '4h', tips: '①禁止穿短裤露肩装；②带小镜子拍天顶画；③记得在地上或垃圾桶里捡门票', intro: '始于1503年教皇尤利乌斯二世的私人收藏，长达7公里的展示走廊汇集历代教皇搜罗的珍宝。1.西斯廷教堂：米开朗基罗天顶画《创世纪》（尤其《创造亚当》）和祭坛壁画《最后的审判》，整个博物馆的灵魂，抬头仰望', lat: 41.9065, lng: 12.4540, order: 2 },
        { name: '圣天使桥 & 圣天使堡', nameIt: "Castel Sant'Angelo", hours: '24h（桥）/ 城堡需购票', cost: '免费（桥）', tags: ['景点'], duration: '30min', tips: '晚上天黑后去，拍天使亲吻圣天使堡的照片', intro: '圣天使桥：通往城堡的桥梁是巴洛克艺术大师贝尼尼及其弟子杰作，桥两侧共十二尊天使雕像，手持耶稣受刑刑具。顶层露台：登顶后可俯瞰台伯河美景，眺望圣彼得大教堂和罗马城，视野极佳。历史与影视：这里曾是教皇避难', lat: 41.9035, lng: 12.4660, order: 3 },
      ],
      transport: { intercity: [], intracity: [{ mode: '地铁/步行', details: '能坐地铁就别坐公交，能走路就别坐车，不要买日票' }] }
    })
  };

  // Day 11: Rome
  const day11: DayRecord = {
    id: 11, day_number: 11, date: '10/4', weekday: '周日', city: '罗马', city_en: 'Roma', sort_order: 11,
    content_json: JSON.stringify({
      overview: { text: '旅程最后一天，献给古罗马的荣光。上午，在万神殿穹顶的光束下感受神圣静谧。下午，站在宏伟的罗马斗兽场前，为这趟跨越千年的意大利之旅画上震撼句点。', cityIntro: '' },
      accommodation: { city: '罗马', checkIn: '同前日住宿', address: 'Via Montebello, 109', condition: '', checkInMethod: '', lat: 41.9100, lng: 12.4960 },
      tips: { items: ['能坐地铁就别坐公交，能走路就别坐车，不要买日票', '其他同那不勒斯交通方式'], packingList: [] },
      locations: [
        { name: '万神殿', nameIt: 'Pantheon', hours: '09:00-19:00', cost: '7€', tags: ['景点'], duration: '1h', tips: '八点半开始排队，排在最左边的队', intro: '至今完整保存的唯一一座罗马帝国时期建筑，被米开朗基罗赞叹为"天使的设计"。始建于公元前27年，后由哈德良皇帝于公元120-124年重建。巨大混凝土穹顶直径和高度均为43.4米，顶部圆形大洞（Oculus）是唯一的采光来源', lat: 41.8986, lng: 12.4769, order: 1 },
        { name: '特莱维喷泉', nameIt: 'Trevi Fountain', hours: '24h', cost: '2€', tags: ['景点'], duration: '30min', tips: '距离万神殿步行600m可达', intro: '罗马最大的巴洛克式喷泉，全球最著名的喷泉之一。由建筑师尼科拉·萨尔维于1762年设计完成，以海神尼普顿战胜归来为主题。因电影《罗马假日》闻名于世，传说背对喷泉投出一枚硬币便能许下"重返罗马"的愿望', lat: 41.9009, lng: 12.4833, order: 2 },
        { name: '博尔盖塞美术馆', nameIt: 'Galleria Borghese', hours: '待定', cost: '免费日（每月第一个周日免费，但仍需网上预约）', tags: ['景点'], duration: '2h', tips: '', intro: '1.贝尼尼《被劫持的普洛塞庇娜》：贝尼尼22岁天才之作，定义了巴洛克雕塑的"瞬间戏剧性"。2.贝尼尼《阿波罗与达芙妮》：达芙妮化身月桂树的刹那——指间长出枝叶，脚趾变成树根，用雕塑讲述"变形记"，运动', lat: 41.9142, lng: 12.4944, order: 3 },
        { name: '罗马斗兽场', nameIt: 'Colosseum', hours: '8:30-19:15', cost: '通票18€ / 含竞技场24€ / 含地宫24€', tags: ['景点'], duration: '3h', tips: '下午14:00后抵达开始排队，可在斗兽场门口领三联票（斗兽场+古罗马广场+帕拉蒂尼山）', intro: '古罗马帝国工程技术与残酷娱乐文化的巅峰见证。原名"弗莱文圆形剧场"，建于公元72-80年间，维斯帕先皇帝下令修建，其子提图斯完工。占地2万平方米，曾容纳5-9万名观众。1.地面看台层（标配）：社会等级', lat: 41.8902, lng: 12.4922, order: 4 },
      ],
      transport: { intercity: [], intracity: [{ mode: '地铁/步行', details: '能坐地铁就别坐公交，能走路就别坐车，不要买日票' }] }
    })
  };

  writeStore('days', [day1, day2, day3, day4, day5, day6, day7, day8, day9, day10, day11]);

  // Expenses
  const expenses: ExpenseRecord[] = [
    { id: 1, date: '2026-09-24', category: '交通', sub_category: '巴勒莫机场→市区', amount: 6.8, currency: 'EUR', split_count: 6, per_person: 1.13, note: '火车' },
    { id: 2, date: '2026-09-24', category: '餐饮', sub_category: '巴勒莫市场', amount: 50, currency: 'EUR', split_count: 6, per_person: 8.33, note: '街头美食' },
    { id: 3, date: '2026-09-24', category: '门票', sub_category: '诺曼王宫', amount: 114, currency: 'EUR', split_count: 6, per_person: 19, note: '19€×6' },
    { id: 4, date: '2026-09-25', category: '交通', sub_category: '巴勒莫→陶尔米纳', amount: 120, currency: 'EUR', split_count: 6, per_person: 20, note: '大巴' },
    { id: 5, date: '2026-09-26', category: '交通', sub_category: '陶尔米纳缆车', amount: 60, currency: 'EUR', split_count: 6, per_person: 10, note: '往返10€×6' },
    { id: 6, date: '2026-09-27', category: '交通', sub_category: '陶尔米纳→锡拉库萨', amount: 80, currency: 'EUR', split_count: 6, per_person: 13.33, note: '火车' },
    { id: 7, date: '2026-09-29', category: '交通', sub_category: '那不勒斯→索伦托', amount: 27.6, currency: 'EUR', split_count: 6, per_person: 4.6, note: '火车' },
    { id: 8, date: '2026-09-29', category: '住宿', sub_category: '那不勒斯公寓', amount: 400, currency: 'EUR', split_count: 6, per_person: 66.67, note: '3晚' },
    { id: 9, date: '2026-09-30', category: '门票', sub_category: '圣塞维诺小堂', amount: 72, currency: 'EUR', split_count: 6, per_person: 12, note: '12€×6' },
    { id: 10, date: '2026-10-01', category: '门票', sub_category: '庞贝古城', amount: 500, currency: 'RMB', split_count: 6, per_person: 83.33, note: '含讲解' },
    { id: 11, date: '2026-10-02', category: '交通', sub_category: '那不勒斯→罗马', amount: 180, currency: 'EUR', split_count: 6, per_person: 30, note: '火车' },
    { id: 12, date: '2026-10-02', category: '住宿', sub_category: '罗马公寓', amount: 300, currency: 'EUR', split_count: 6, per_person: 50, note: '3晚' },
    { id: 13, date: '2026-10-03', category: '门票', sub_category: '梵蒂冈博物馆', amount: 150, currency: 'EUR', split_count: 6, per_person: 25, note: '25€×6' },
    { id: 14, date: '2026-10-04', category: '门票', sub_category: '罗马斗兽场', amount: 108, currency: 'EUR', split_count: 6, per_person: 18, note: '通票18€×6' },
  ];
  writeStore('expenses', expenses);

  // Checklist
  const checklist: ChecklistRecord[] = [
    // 必需品
    { id: 1, label: '护照', checked: 0, category: '必需品', sort_order: 1 },
    { id: 2, label: '现金（欧元）', checked: 0, category: '必需品', sort_order: 2 },
    { id: 3, label: '信用卡（Visa/Mastercard）', checked: 0, category: '必需品', sort_order: 3 },
    { id: 4, label: '机票行程单', checked: 0, category: '必需品', sort_order: 4 },
    { id: 5, label: '酒店预订确认单', checked: 0, category: '必需品', sort_order: 5 },
    { id: 6, label: '旅行保险单', checked: 0, category: '必需品', sort_order: 6 },
    { id: 7, label: '身份证', checked: 0, category: '必需品', sort_order: 7 },
    // 衣物
    { id: 8, label: '短袖T恤 x3', checked: 0, category: '衣物', sort_order: 8 },
    { id: 9, label: '长裤 x2', checked: 0, category: '衣物', sort_order: 9 },
    { id: 10, label: '连衣裙/衬衫', checked: 0, category: '衣物', sort_order: 10 },
    { id: 11, label: '披肩外套', checked: 0, category: '衣物', sort_order: 11 },
    { id: 12, label: '内衣裤 x4', checked: 0, category: '衣物', sort_order: 12 },
    { id: 13, label: '袜子 x4', checked: 0, category: '衣物', sort_order: 13 },
    { id: 14, label: '舒适步行鞋', checked: 0, category: '衣物', sort_order: 14 },
    { id: 15, label: '凉鞋/拖鞋', checked: 0, category: '衣物', sort_order: 15 },
    { id: 16, label: '帽子', checked: 0, category: '衣物', sort_order: 16 },
    { id: 17, label: '泳衣', checked: 0, category: '衣物', sort_order: 17 },
    // 日常洗漱
    { id: 18, label: '牙刷牙膏', checked: 0, category: '日常洗漱', sort_order: 18 },
    { id: 19, label: '洗发水/沐浴露', checked: 0, category: '日常洗漱', sort_order: 19 },
    { id: 20, label: '洗面奶', checked: 0, category: '日常洗漱', sort_order: 20 },
    { id: 21, label: '护肤品', checked: 0, category: '日常洗漱', sort_order: 21 },
    { id: 22, label: '防晒霜', checked: 0, category: '日常洗漱', sort_order: 22 },
    { id: 23, label: '毛巾', checked: 0, category: '日常洗漱', sort_order: 23 },
    { id: 24, label: '梳子', checked: 0, category: '日常洗漱', sort_order: 24 },
    // 电子产品
    { id: 25, label: '手机', checked: 0, category: '电子产品', sort_order: 25 },
    { id: 26, label: '充电器', checked: 0, category: '电子产品', sort_order: 26 },
    { id: 27, label: '充电宝', checked: 0, category: '电子产品', sort_order: 27 },
    { id: 28, label: '转换插头（欧标）', checked: 0, category: '电子产品', sort_order: 28 },
    { id: 29, label: '相机', checked: 0, category: '电子产品', sort_order: 29 },
    { id: 30, label: '相机充电器', checked: 0, category: '电子产品', sort_order: 30 },
    { id: 31, label: '存储卡', checked: 0, category: '电子产品', sort_order: 31 },
    { id: 32, label: '耳机', checked: 0, category: '电子产品', sort_order: 32 },
    // 化妆品
    { id: 33, label: '基础彩妆', checked: 0, category: '化妆品', sort_order: 33 },
    { id: 34, label: '卸妆用品', checked: 0, category: '化妆品', sort_order: 34 },
    { id: 35, label: '面膜', checked: 0, category: '化妆品', sort_order: 35 },
    { id: 36, label: '香水', checked: 0, category: '化妆品', sort_order: 36 },
    // 杂物
    { id: 37, label: '雨伞', checked: 0, category: '杂物', sort_order: 37 },
    { id: 38, label: '墨镜', checked: 0, category: '杂物', sort_order: 38 },
    { id: 39, label: '颈枕', checked: 0, category: '杂物', sort_order: 39 },
    { id: 40, label: '眼罩耳塞', checked: 0, category: '杂物', sort_order: 40 },
    { id: 41, label: '常用药品', checked: 0, category: '杂物', sort_order: 41 },
    { id: 42, label: '创可贴', checked: 0, category: '杂物', sort_order: 42 },
    { id: 43, label: '湿纸巾', checked: 0, category: '杂物', sort_order: 43 },
    { id: 44, label: '购物袋', checked: 0, category: '杂物', sort_order: 44 },
  ];
  writeStore('checklist', checklist);

  // Bookings
  const bookings: BookingRecord[] = [
    { id: 1, city: '巴勒莫', date: '9/24', attraction: '诺曼王宫&帕拉蒂尼礼拜堂', price: '19€', need_reservation: 1, booking_link: '', note: '建议预约', sort_order: 1 },
    { id: 2, city: '那不勒斯', date: '9/30', attraction: '圣塞维诺小堂', price: '12€', need_reservation: 1, booking_link: '', note: '必须提前官网预约，提前两天会再放一次票，线下买不到票', sort_order: 2 },
    { id: 3, city: '庞贝', date: '10/1', attraction: '庞贝古城', price: '500 RMB', need_reservation: 1, booking_link: '', note: '已含讲解', sort_order: 3 },
    { id: 4, city: '罗马', date: '10/3', attraction: '梵蒂冈博物馆', price: '25€（免费日0€）', need_reservation: 1, booking_link: '', note: '每月最后一个周日免费，可现场排队领票；线下可尝试下午排队或谷歌地图搜"tours"买团票', sort_order: 4 },
    { id: 5, city: '罗马', date: '10/4', attraction: '博尔盖塞美术馆', price: '免费日0€', need_reservation: 1, booking_link: '', note: '每月第一个周日免费', sort_order: 5 },
    { id: 6, city: '罗马', date: '10/4', attraction: '罗马斗兽场', price: '通票18€', need_reservation: 1, booking_link: '', note: '邪道购票：使用Roma Pass（先去斗兽场官网查Roma Pass通道预约，锁定后购买Roma Pass，入场时先展示斗兽场预约单再刷Roma Pass二维码）', sort_order: 6 },
  ];
  writeStore('bookings', bookings);
}
