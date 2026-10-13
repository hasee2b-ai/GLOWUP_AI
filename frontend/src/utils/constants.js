// Shared constants for the generation workspace.

export const ASPECT_RATIOS = [
  { id: 'square', label: 'Square', size: '1024x1024', hint: '1:1' },
  { id: 'portrait', label: 'Portrait', size: '1024x1536', hint: '2:3' },
  { id: 'landscape', label: 'Landscape', size: '1536x1024', hint: '3:2' },
]

export const IMAGE_COUNTS = [1, 2, 4]

export const MAX_PROMPT_LENGTH = 4000

export const EXAMPLE_PROMPTS = [
  {
    id: 'photorealism',
    label: 'Photorealism',
    prompt:
      'A hyper-realistic portrait of a woman with freckles, soft natural window light, shallow depth of field, 85mm lens, cinematic color grading',
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    prompt:
      'A majestic dragon coiled around a crystalline tower floating above a sea of clouds at twilight, epic fantasy digital painting, intricate detail',
  },
  {
    id: 'anime',
    label: 'Anime',
    prompt:
      'A cheerful anime girl with turquoise hair standing in a field of lavender under a pastel sunset, studio ghibli inspired, soft cel shading',
  },
  {
    id: 'product',
    label: 'Product',
    prompt:
      'A minimalist product photograph of a matte black perfume bottle on a marble surface, soft studio lighting, luxury advertising style, high detail',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    prompt:
      'A lone astronaut standing on a rocky alien planet, two moons in the sky, cinematic film still, dramatic rim lighting, anamorphic lens flare',
  },
  {
    id: 'digital-art',
    label: 'Digital Art',
    prompt:
      'An abstract composition of glowing geometric shapes and flowing neon ribbons in violet and cyan, dark background, digital art, sharp details',
  },
]
