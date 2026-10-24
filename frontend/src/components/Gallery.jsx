import CircularGallery from './CircularGallery.jsx'

const ARTWORKS = [
  {
    image: '/gallery-1.webp',
    text: 'Lotus Pond',
    description: 'An ink-wash study of lotus blooms drifting across a quiet pond.',
    alt: 'Traditional ink painting of lotus flowers on a pond',
  },
  {
    image: '/gallery-2.webp',
    text: 'Little Gentleman',
    description: 'Round glasses, a paper moustache and a very serious bow tie.',
    alt: 'Laughing boy in round glasses, fake moustache and a red bow tie',
  },
  {
    image: '/gallery-3.webp',
    text: 'Spirit Pond',
    description: 'A fox-eared shrine maiden scattering feed for glowing koi beneath the blossoms.',
    alt: 'Shrine maiden with fox ears feeding luminous koi in a forest pond',
  },
  {
    image: '/gallery-4.webp',
    text: 'Golden Hour Ride',
    description: 'Sunset light washing over a quiet evening train ride.',
    alt: 'Anime illustration of a girl watching the sunset from a train',
  },
  {
    image: '/gallery-5.webp',
    text: 'Crimson Moon',
    description: 'A hooded swordsman under a blood-red moon, drawn in stark ink.',
    alt: 'Manga-style hooded swordsman on a bridge beneath a red moon',
  },
  {
    image: '/gallery-6.webp',
    text: 'Neon Samurai',
    description: 'White armour and a glowing blade in a rain-soaked neon alley.',
    alt: 'Cyberpunk samurai with a glowing sword in a neon-lit rainy alley',
  },
  {
    image:
      '/high-level-description-a-romantic-rococo_3rurGI48VtCN8nnx6_6TLg_Lq7dWnpjQV-6axGXi1RkmQ.jpg',
    text: 'Parasol Frog',
    description:
      'A tree frog holding court beneath a lace parasol in a rain-washed rococo garden.',
    alt: 'Green tree frog under a pink lace parasol in a gilded garden',
  },
  {
    image:
      '/high-level-description-an-unfinished-arc_eYE3AEYsX9-5AV1ZXQPZdg_3l8i19BOTOeFPvGEY0W8xA.jpg',
    text: 'City Stroll',
    description:
      'A lone cat crossing a rain-slicked avenue beneath a glowing skyline.',
    alt: 'Watercolour sketch of a black cat on a New York avenue at night',
  },
  {
    image:
      '/high-level-description-a-photorealistic-_4-jT9CLJXnuk-U3Wy3_f_w_2AtSei-wTcWcBJHEtSwWmg.jpg',
    text: 'Jupiter Rising',
    description:
      'Two explorers filming a rover sortie with Jupiter filling the sky.',
    alt: 'Photoreal astronauts on a moon with Jupiter looming overhead',
  },
  {
    image:
      '/a-luminous-impasto-art-nouveau-oil-paint_2RCSBeEaW_aZC6GW4k4cjg_yaqghDrxS2iOViyXWkfeDA.jpg',
    text: 'Daisy Meadow',
    description:
      'A child pausing to hold a single bloom while a white butterfly drifts by.',
    alt: 'Oil painting of a girl holding a daisy in a field of wildflowers',
  },
]

/**
 * Artwork showcase rendered as a curved, draggable WebGL carousel
 * (React Bits CircularGallery). Drag or scroll to move along the arc,
 * click a card to open it full size, click again or press Escape to close.
 */
export default function Gallery() {
  return (
    <div className="h-[340px] sm:h-[440px] lg:h-[560px]">
      <CircularGallery
        items={ARTWORKS}
        bend={2.6}
        textColor="#242033"
        font="bold 30px Manrope"
        fontUrl="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap"
        borderRadius={0.06}
        itemSize={1.07}
        scrollEase={0.06}
        autoScroll={0.35}
      />
    </div>
  )
}
