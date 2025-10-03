export default function AdminContentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  //      const content = await fetchContent(params.id);
  //   if (!content) {
  //   <MissingContentNotice /> 삭제된 컨텐츠입니다. 같은 컴포넌트를 재사용할 수 있습니다.
  //   }
  return <div>관리자 콘텐츠 상세 페이지 입니다.</div>;
}
