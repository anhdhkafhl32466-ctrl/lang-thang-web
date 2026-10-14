import { Metadata } from 'next';
import SilkGame from '@/components/game-silk/SilkGame';

export const metadata: Metadata = {
  title: 'Sắc Lụa Vạn Phúc - Mini Game Dệt Lụa Truyền Thống Hà Đông',
  description: 'Trải nghiệm dệt lụa tơ tằm Vạn Phúc thủ công: Sáng tạo hoa văn gấm hoa, thoi đưa đập go và nhận tuyệt tác khăn lụa của riêng bạn.'
};

export default function SilkWeavingExperiencePage() {
  return <SilkGame />;
}
