// 환경 변수를 읽어올 때 사용하는 작은 헬퍼입니다.
// process.env를 직접 접근하는 대신 이 함수를 사용해 누락 시 빠르게 에러를 확인합니다.
export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경 변수가 설정되지 않았습니다: ${key}`);
  }
  return value;
}
