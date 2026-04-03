import { useNavigate, useParams } from "react-router";
import { useState } from "react";
import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../../components/ui/drawer";
import grandfatherImage from "figma:asset/20146946046d36208cb800f20e245b496bf1e5db.png";
import flowerImage from "figma:asset/d44c93e63548e05ec801354bbf8f2d6ab461ca41.png";
import profile1 from "figma:asset/1c1e3bed656961ad27fe0f9df28e4f656ab37c45.png";

const giftItems = [
  { id: 1, name: "꽃다발", image: flowerImage, price: 10 },
  { id: 2, name: "카네이션", image: flowerImage, price: 10 },
  { id: 3, name: "해바라기", image: flowerImage, price: 10 },
  { id: 4, name: "장미", image: flowerImage, price: 10 },
];

export function CloneDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showGiftModal, setShowGiftModal] = useState(false);

  return (
    <>
      <div className="relative h-screen bg-zinc-950 overflow-hidden">
        {}
        <div className="absolute inset-0">
          <img
            src={grandfatherImage}
            alt="Clone"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/80" />
        </div>

        {}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-zinc-950/80 to-transparent z-10">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900/80 rounded-full backdrop-blur-sm">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>

            <img
              src={profile1}
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          </div>
        </div>

        {}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <button
            onClick={() => setShowGiftModal(true)}
            className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center ml-auto mb-4 shadow-lg shadow-purple-500/50 hover:scale-110 transition-transform"
          >
            <Gift className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>

      {}
      <Drawer open={showGiftModal} onOpenChange={setShowGiftModal}>
        <DrawerContent className="bg-zinc-900 border-zinc-800">
          <DrawerHeader>
            <DrawerTitle className="text-white">선물 보내기</DrawerTitle>
            <DrawerDescription className="text-zinc-400">
              페르소나에게 특별한 선물을 보내보세요
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pb-8">
            {}
            <div className="bg-zinc-800 rounded-xl p-4 mb-6 flex items-center justify-between">
              <span className="text-zinc-400">보유 XRUN</span>
              <span className="text-xl font-bold text-white">1,250</span>
            </div>

            {}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {giftItems.map((gift) => (
                <button
                  key={gift.id}
                  className="bg-zinc-800 rounded-2xl p-4 hover:bg-zinc-700 transition-colors border-2 border-transparent hover:border-purple-500"
                >
                  <div className="aspect-square rounded-xl bg-zinc-900 mb-3 flex items-center justify-center overflow-hidden">
                    <img src={gift.image} alt={gift.name} className="w-full h-full object-contain p-4" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{gift.name}</h3>
                  <p className="text-sm text-purple-400 font-medium">{gift.price} XRUN</p>
                </button>
              ))}
            </div>

            <Button className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              선물 보내기
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}