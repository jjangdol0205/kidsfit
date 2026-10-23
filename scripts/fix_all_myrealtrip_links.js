const fs = require('fs');
const https = require('https');

const MRT_API_KEY = 'mAGXbDg5IJOskYOJT37C9R0K9X4JLQ2Cqc6I1GbQSTQBxylFekE4FwWXQeXRtvo0';

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'partner-ext-api.myrealtrip.com',
      path,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + MRT_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getRedirectLocation(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(decodeURIComponent(res.headers.location || ''));
    }).on('error', () => resolve(''));
  });
}

const FALLBACK_KEYWORDS = {
  '서대문자연사박물관 투어': ['서대문자연사박물관', '박물관 도슨트', '국립중앙박물관'],
  '파주 헤이리 예술마을 체험': ['파주 헤이리', '파주', '미술관 도슨트'],
  '제주 아쿠아플라넷 스누피가든': ['제주 아쿠아플라넷', '스누피가든', '제주 투어패스'],
  '도쿄 디즈니랜드 나리타 리무진': ['나리타 리무진', '도쿄 디즈니', '도쿄 패스'],
  '국립중앙박물관 어린이 투어': ['국립중앙박물관', '경복궁 투어'],
  '오사카 유니버설 스튜디오 재팬': ['유니버설 스튜디오 재팬', '오사카 주유패스', '오사카'],
  '판교 어린이 책미술관 전시': ['미술관 도슨트', '박물관 투어', '과천과학관'],
  '서울 키즈 과학 로봇 체험': ['과학관', '과천과학관', '서울시립과학관'],
  '예술의전당 어린이 공연 전시': ['예술의전당', '미술관 도슨트', '서울 전시'],
  '홍대 대학로 어린이 전시 체험': ['대학로', '서울 공연', '미술관 도슨트'],
  '서울시립과학관 천문대 투어': ['서울시립과학관', '과천과학관', '과학관'],
  '남산 국립극장 어린이 뮤지컬': ['국립중앙박물관', '서울 투어', '경복궁'],
  '수원 미술관 화성행궁 투어': ['수원화성', '화성행궁', '수원'],
  '수원화성 해설 투어': ['수원화성', '화성행궁', '수원'],
  '국립과천과학관 투어': ['국립과천과학관', '과천과학관', '과학관'],
  '용인 어린이 공연 뮤지컬': ['에버랜드', '한국민속촌', '용인'],
  '강화도 역사 박물관 투어': ['강화도', '인천 투어', '역사 투어'],
  '아쿠아플라넷 일산': ['아쿠아플라넷 일산', '일산 아쿠아플라넷', '아쿠아리움'],
  '인천 어린이 과학관 강화 우주센터': ['강화도', '인천', '과천과학관'],
  '파주 출판단지 박물관 투어': ['파주', '박물관 도슨트', '헤이리'],
  '부산 현대미술관 을숙도 생태 투어': ['부산 투어', '부산 요트', '해운대'],
  '부산 박물관 동래 역사 투어': ['부산 역사', '부산 투어', '경주 투어'],
  '부산 해운대 아쿠아리움': ['해운대 아쿠아리움', '씨라이프 부산', '부산 아쿠아리움'],
  '부산 과학관 기장 투어': ['부산 롯데월드', '기장', '부산 투어'],
  '부산 어린이 공연 요트 투어': ['부산 요트', '해운대 요트', '부산 투어'],
  '대구 미술관 수성못 투어': ['대구 이월드', '대구 투어', '경주 투어'],
  '경주 역사 해설 투어': ['경주 역사', '경주 도슨트', '국립경주박물관'],
  '대구 이월드 네이처파크': ['대구 이월드', '네이처파크', '대구'],
  '대구 과학관 현풍 투어': ['대구 이월드', '네이처파크', '경주'],
  '대구 오페라하우스 어린이 공연': ['대구 이월드', '대구', '경주 월정교'],
  '대전 미술관 한밭수목원 투어': ['대전 오월드', '대전', '공주 부여'],
  '공주 부여 백제 역사 투어': ['공주 부여', '부여', '공주'],
  '대전 오월드 아쿠아리움': ['대전 오월드', '대전 아쿠아리움', '오월드'],
  '대전 국립중앙과학관 투어': ['국립중앙과학관', '대전 과학관', '대전 오월드'],
  '대전 어린이회관 공연 체험': ['대전 오월드', '대전 아쿠아리움', '부여'],
  '광주 아시아문화전당 어린이 투어': ['전주 한옥마을', '여수', '순천'],
  '전주 한옥마을 체험': ['전주 한옥마을', '전주', '한옥마을'],
  '목포 해남 공룡박물관 투어': ['목포', '여수 아쿠아플라넷', '여수'],
  '광주 과학관 여수 예술랜드': ['여수 예술랜드', '여수 아쿠아플라넷', '여수'],
  '여수 아쿠아플라넷': ['여수 아쿠아플라넷', '아쿠아플라넷 여수', '여수']
};

async function findLiveMrtProduct(query) {
  const candidates = [
    query,
    ...(FALLBACK_KEYWORDS[query] || []),
    query.split(' ').slice(0, 2).join(' '),
    query.split(' ')[0],
    '박물관 투어'
  ].filter(Boolean);

  for (const kw of candidates) {
    const res = await postJson('/v1/products/tna/search', { keyword: kw, page: 1, size: 5 });
    const items = res && res.data && res.data.data && res.data.data.items;
    if (Array.isArray(items) && items.length > 0 && items[0].productUrl) {
      return { kw, item: items[0] };
    }
  }
  return null;
}

(async () => {
  const f1 = 'src/js/pinpoint-curator.js';
  const f2 = 'src/data/curation-catalog.json';
  let txt1 = fs.readFileSync(f1, 'utf8');
  let txt2 = fs.readFileSync(f2, 'utf8');

  const urls = [...new Set([
    ...(txt1.match(/https:\/\/myrealt\.rip\/[A-Za-z0-9]+/g) || []),
    ...(txt2.match(/https:\/\/myrealt\.rip\/[A-Za-z0-9]+/g) || [])
  ])];

  let replaced = 0;
  for (const oldUrl of urls) {
    const loc = await getRedirectLocation(oldUrl);
    if (loc.includes('/products/')) {
      console.log('KEEP VALID PRODUCT MRT:', oldUrl, '->', loc);
      continue;
    }
    const m = loc.match(/[?&]q=([^&]+)/);
    const q = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '코엑스 아쿠아리움';
    const found = await findLiveMrtProduct(q);
    if (!found) {
      console.log('WARN NO PRODUCT FOUND FOR:', q);
      continue;
    }
    const mintRes = await postJson('/v1/mylink', { targetUrl: found.item.productUrl });
    const newShortUrl = mintRes && mintRes.data && mintRes.data.data && mintRes.data.data.mylink;
    if (newShortUrl) {
      console.log(`FIXED [${q}] (via "${found.kw}" -> ${found.item.itemName}): ${oldUrl} => ${newShortUrl}`);
      txt1 = txt1.split(oldUrl).join(newShortUrl);
      txt2 = txt2.split(oldUrl).join(newShortUrl);
      replaced++;
    }
  }

  fs.writeFileSync(f1, txt1, 'utf8');
  fs.writeFileSync(f2, txt2, 'utf8');
  console.log('Total replaced MyRealTrip shortlinks:', replaced);
})();
