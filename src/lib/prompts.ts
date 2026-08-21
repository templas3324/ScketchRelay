export const RANDOM_PROMPTS = [
  "우주에서 라면을 끓이는 고양이",
  "엘리베이터를 타고 출근하는 공룡",
  "비 오는 날 우산을 쓴 문어",
  "달에서 떡볶이를 파는 토끼",
  "바닷속에서 캠핑하는 가족",
  "시험을 보다가 잠든 마법사",
  "스케이트보드를 타는 펭귄",
  "구름 위에서 빨래하는 천사",
  "헬스장에서 운동하는 로봇",
  "치과에 간 드라큘라",
  "편의점에서 아르바이트하는 외계인",
  "지하철을 놓친 거북이",
  "노래방에서 열창하는 사자",
  "눈사람과 여름휴가를 떠난 아이",
  "김치찌개를 처음 먹은 왕자",
  "도서관에서 숨바꼭질하는 유령",
  "배달 음식을 기다리는 산타",
  "커피를 마시며 회의하는 강아지",
  "놀이공원에 혼자 온 좀비",
  "무인도에서 와이파이를 찾는 해적",
  "축구 경기에 출전한 닭",
  "한강에서 낚시하는 인어",
  "미용실에서 파마하는 곰",
  "요리 대회에 나온 탐정",
] as const;

export function selectRandomPrompts(count: number, random = Math.random) {
  if (!Number.isInteger(count) || count < 0 || count > RANDOM_PROMPTS.length) throw new RangeError("제시어 개수를 확인해 주세요.");
  const pool = [...RANDOM_PROMPTS];
  // 중복 없는 앞쪽 구간만 필요하므로 전체 배열을 섞지 않고 필요한 횟수만 교환한다.
  for (let index = 0; index < count; index += 1) {
    const pickedIndex = index + Math.floor(random() * (pool.length - index));
    [pool[index], pool[pickedIndex]] = [pool[pickedIndex], pool[index]];
  }
  return pool.slice(0, count);
}
