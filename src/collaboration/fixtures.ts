import type { Brand } from '../domain/types';
import type { InvitationDraft } from '../domain/invitation';
import type { ProjectBrand, VisualIdentity } from './model';

function brand(id: string, name: string, category: string, summary: string, offers: string, audience: string, identity: string): Brand {
  return { id, name, category, summary, offers, audience, identity, fictional: true, characterSeed: id.length * 47,
    needs: '进入相邻生活方式品牌的受众，以内容互荐增加认知。', intent: '一对一品牌互荐；先做双方渠道内容试投放。',
    constraints: '沿用已有标识、商品和包装；不承诺触达量、销售量或对方资源。', evidence: '平台编写的虚构品牌档案，仅供流程演示。' };
}
export const DEMO_BRANDS: ProjectBrand[] = [
  { brand: brand('zaoba-coffee', '早八咖啡', '社区咖啡', '一间以日常咖啡和街区熟客为核心的独立咖啡店。', '已有咖啡产品、门店内容照片、小红书与门店展示位。', '附近上班族、日常咖啡爱好者。', '朱红、米白、直接而温暖的文字标识。'), visual: { wordmark: 'ZAOBA COFFEE', background: '#C94B32', foreground: '#FFF7E9', accent: '#C94B32', source: 'fictional', photo: '/collaboration/coffee-books.png' } },
  { brand: brand('liubai-books', '留白书店', '独立书店', '围绕文学、设计和生活阅读选书的街区独立书店。', '选书内容、书店场景照片、公众号与读者社群。', '附近读者、设计从业者和喜欢周末逛书店的人。', '深松绿、纸张米白、安静的中文书刊排版。'), visual: { wordmark: 'LIUBAI BOOKS', background: '#F3EBDD', foreground: '#274A3C', accent: '#274A3C', source: 'fictional', photo: '/collaboration/bookstore-coffee.png' } },
  { brand: brand('qingshan-tea', '青山茶事', '日常茶饮', '以易冲泡的原叶茶和品茶知识陪伴日常生活。', '已有茶品、冲泡内容、品牌社交账号。', '喜欢茶与安静生活的年轻消费者。', '苔绿、原纸、克制的文字排版。'), visual: { wordmark: 'QINGSHAN TEA', background: '#DDE2D3', foreground: '#354B36', accent: '#354B36', source: 'fictional' } },
  { brand: brand('qimu-objects', '栖木器物', '日用器物', '为日常餐桌选择耐用、朴素的陶瓷和木作。', '已有杯碟器物、使用场景图、品牌内容渠道。', '关心餐桌、手作与居家体验的人。', '赤陶、白底、编辑式的器物目录。'), visual: { wordmark: 'QIMU OBJECTS', background: '#EDE5DC', foreground: '#854935', accent: '#854935', source: 'fictional' } },
];
export function visualForBrand(value: Brand): VisualIdentity {
  return DEMO_BRANDS.find(item => item.brand.id === value.id)?.visual ?? { wordmark: value.name, background: '#FFFFFF', foreground: '#111111', accent: '#111111', source: 'unprovided' };
}
export function initialBrief(a: Brand, b: Brand): InvitationDraft {
  const coffeeBooks = a.id === 'zaoba-coffee' && b.id === 'liubai-books';
  return { title: coffeeBooks ? '把日常，读慢一点。' : `${a.name} × ${b.name} · 日常相遇`,
    concept: coffeeBooks ? '双方各发一篇「咖啡与阅读」主题内容：让咖啡常客发现附近的独立书店，让读者认识一杯好咖啡。先用各自现有渠道做一次相互推荐。' : `围绕共同的日常生活场景，${a.name} 与 ${b.name} 各发布一篇伙伴介绍，向原有受众提供一个值得了解的新品牌。`,
    contribution: `拟由 ${a.name} 提供已有品牌素材，在自己的渠道发布一次伙伴介绍；具体渠道与时间待确认。`,
    ask: `邀请 ${b.name} 提供已有素材，并在其渠道介绍 ${a.name}；是否参与、渠道与时间由对方确认。`,
    diagnostics: ['消费者可以从熟悉品牌的推荐中发现相关的产品和生活方式；实际兴趣需以内容反馈验证。', '各自承担本方内容制作、审稿与发布；关注新增品牌认知，不预设销量或曝光保证。', '本方审核自己的标识与内容，对方复核涉及自己的表述；排期、素材许可和退出方式待双方确认。'] };
}
