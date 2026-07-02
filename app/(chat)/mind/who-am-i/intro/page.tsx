"use client";

import {
  AppCard,
  AppShell,
  Badge,
  Button,
  Muted,
  PageHero,
  SectionHeading,
} from "@/components/mind/app-shell";

const BULLETS = [
  "Амьдралынхаа тэнцвэрийг үнэлэх",
  "Өөрийгөө ажиглаж, эргэцүүлэх",
  "Өөрийн ур чадвар, нөөц боломжоо танин мэдэх",
  "Өөрийгөө илүү сайн ойлгож, хүлээн зөвшөөрөх",
  "Амьдралдаа юунд илүү анхаарах хэрэгтэйгээ олж мэдэх",
];

export default function WhoAmIIntroPage() {
  return (
    <AppShell backHref="/" title="Танилцуулга" width="4xl">
      <AppCard>
        <PageHero
          description="Сэтгэлийн амар тайван өөрийгөө ойлгохоос эхэлдэг."
          eyebrow={<Badge>Үндсэн хөтөлбөр</Badge>}
          icon="🧭"
          title="Би хэн бэ?"
        />

        <Muted className="mb-4">
          Бид өдөр бүр олон мэдрэмж, бодол, харилцаа, үүрэг хариуцлагын дунд
          амьдардаг. Гэвч заримдаа өөрийгөө яг юу мэдэрч байгаагаа, юунд хамгийн
          их цаг хугацаа, эрч хүчээ зарцуулж байгаагаа анзаардаггүй.
        </Muted>

        <Muted className="mb-4">
          Энэхүү хөтөлбөр нь таныг өөрийгөө илүү сайн таньж мэдэх, амьдралынхаа
          өнөөгийн байдлыг олж харах, өөрийн хэрэгцээ, мэдрэмж, давуу болон
          хөгжүүлэх талуудаа ойлгоход туслах зорилготой.
        </Muted>

        <Muted className="mb-6">
          Эерэг сэтгэл заслын онолд хүний амьдралыг Эрүүл мэнд, Ажил үүрэг,
          Харилцаа, Утга учир ба Ирээдүй гэсэн 4 талбарт хуваадаг. Эдгээр
          талбарын тэнцвэр ямар байхаас хамааран хүний сэтгэлзүй, амьдралын
          чанарт чухал нөлөө үзүүлдэг юм.
        </Muted>

        <SectionHeading className="mb-2">Энэхүү хөтөлбөрөөр та:</SectionHeading>
        <ul
          className="mb-6 space-y-1.5 text-sm leading-relaxed"
          style={{ color: "#334155" }}
        >
          {BULLETS.map((b) => (
            <li className="flex items-start gap-2" key={b}>
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full"
                style={{ background: "#1F6FB2" }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <Button href="/mind/who-am-i/balance-test">
          Амьдралын тэнцвэрээ шалгах →
        </Button>
      </AppCard>
    </AppShell>
  );
}
