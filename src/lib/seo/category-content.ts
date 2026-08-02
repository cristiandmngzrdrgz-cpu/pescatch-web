// Contenido SEO por categoría: bloque introductorio + FAQ (visible y JSON-LD).
// La clave es el slug de la categoría de /categories.

export interface CategorySeoContent {
  intro: string
  faq: Array<{ question: string; answer: string }>
}

// Mapea slug de categoría → categoría real usada en el campo `category` de los posts.
export const BLOG_CATEGORY_BY_SLUG: Record<string, string> = {
  carretes: 'Carretes',
  canas: 'Cañas',
  senuelos: 'Señuelos',
}

export const CATEGORY_SEO: Record<string, CategorySeoContent> = {
  carretes: {
    intro:
      'Los carretes de pesca son el corazón del equipo: de spinning para lanzar señuelos, de surfcasting para distancias largas o de jigging para trabajar el fondo. Aquí recopilamos los mejores chollos en carretes de Shimano, Daiwa, Penn, Abu Garcia y Mitchell, con descuentos reales en Amazon, Decathlon y AliExpress.',
    faq: [
      {
        question: '¿Qué carrete de pesca me compro?',
        answer:
          'Si empiezas o pescas con señuelos, un carrete de spinning de 2000-3000 convence para la mayoría de escenarios. Para surfcasting necesitas un carrete de gran capacidad de línea. Los precios de los chollos que publicamos suelen rondar entre 30 y 120 €.',
      },
      {
        question: '¿Cuánto dura un carrete de pesca?',
        answer:
          'Con un mantenimiento básico (aflojar el freno, aclarar con agua dulce y engrasar una vez al año), un carrete de gama media te dura varios años. La calidad de los rodamientos y del material del cuerpo marca la diferencia a largo plazo.',
      },
      {
        question: '¿Dónde encontrar carretes baratos?',
        answer:
          'En PesCatch rastreamos ofertas de carretes en Amazon, Decathlon y AliExpress. Revisa la categoría a menudo: los descuentos en modelos de gama media-alta suelen durar pocos días.',
      },
    ],
  },
  canas: {
    intro:
      'La caña es la herramienta que transmite cada picada: de spinning, surfcasting, jigging o eging, cada modalidad pide un modelo concreto. Reunimos los mejores chollos en cañas de Shimano, Daiwa, PENN y Caperlan, con ofertas verificadas en Amazon, Decathlon y AliExpress.',
    faq: [
      {
        question: '¿Qué caña necesito para pescar en la playa?',
        answer:
          'Para surfcasting en playa necesitas cañas largas, de 350 a 500 cm, que lancen plomos de 100-150 g. En la categoría verás ofertas de cañas de surfcasting de marcas como PENN, Daiwa y Shimano.',
      },
      {
        question: '¿Qué diferencia hay entre una caña de spinning y una de surfcasting?',
        answer:
          'Las de spinning son más cortas (210-300 cm) y están pensadas para lanzar señuelos. Las de surfcasting son más largas y potentes, para lanzar plomos y cebo a gran distancia con líneas finas.',
      },
      {
        question: '¿Cuánto cuesta una caña de pesca buena?',
        answer:
          'Una caña de gama media de calidad arranca en unos 60-80 €. En los chollos de PesCatch encuentras descuentos en modelos de 100-200 € que bajan hasta un 40% o más.',
      },
    ],
  },
  senuelos: {
    intro:
      'Los señuelos son el engaño perfecto para cada depredador: vinilos, paseantes, jigs, cucharillas y señuelos de eging. Aquí encontrarás los mejores chollos en señuelos y kits de señuelos en Amazon, Decathlon y AliExpress, ideales para spinning, jigging y curricán.',
    faq: [
      {
        question: '¿Qué señuelo usar para la lubina?',
        answer:
          'Los vinilos y paseantes pequeños (5-15 g) funcionan muy bien para lubina en costa. Los jigs metálicos son efectivos para lances largos y profundidad. La gama de colores claros suele ser la más productiva.',
      },
      {
        question: '¿Merece la pena un kit de señuelos para empezar?',
        answer:
          'Sí. Un kit variado te permite probar vinilos, cucharillas y paseantes sin gastar una fortuna en cada unidad. En la categoría publicamos chollos de kits de señuelos con decenas de piezas por poco dinero.',
      },
      {
        question: '¿Cada cuánto se cambia un señuelo?',
        answer:
          'No hay una regla fija: cambia de señuelo si no picas en 30-60 minutos o si cambian las condiciones (luz, fondo, corriente). Tener 2-3 tipos distintos en la caja multiplica tus opciones.',
      },
    ],
  },
  accesorios: {
    intro:
      'Del plomo al fluorocarbono, pasando por cajas, sacos y herramientas: los accesorios completan tu equipo de pesca. Recopilamos chollos de accesorios de pesca en Amazon, Decathlon y AliExpress, para que ahorres en lo que siempre se acaba gastando.',
    faq: [
      {
        question: '¿Qué accesorios son imprescindibles para pescar?',
        answer:
          'Plomos, anzuelos, bajos de línea, un buen alicate y una caja para el material. Los kits de accesorios que publicamos suelen incluir variedad por poco precio, ideal para empezar o reponer.',
      },
      {
        question: '¿Qué fluorocarbono elegir?',
        answer:
          'Para el bajo de línea busca un fluorocarbono de buena marca con el diámetro adecuado a tu anzuelo o señuelo. Es casi invisible bajo el agua y resistente a la abrasión.',
      },
    ],
  },
  ropa: {
    intro:
      'Vadeadores, chaquetas, guantes y ropa técnica para pescadores: la ropa adecuada marca la diferencia en una jornada larga. Aquí verás chollos de ropa de pesca en Amazon, Decathlon y AliExpress, con descuentos reales y stock actualizado.',
    faq: [
      {
        question: '¿Qué vadeador me compro?',
        answer:
          'Depende de tu pesca: para spinning en río y embalse un vadeador de neopreno o breathable te mantiene seco y cómodo. Comprueba la talla y el tipo de suela según el terreno donde pesques.',
      },
    ],
  },
  nautica: {
    intro:
      'Equipamiento náutico, kayaks y accesorios para pescar desde el agua. Publicamos ofertas verificadas en Amazon, Decathlon y AliExpress para que equipes tu embarcación o kayak sin pagar de más.',
    faq: [
      {
        question: '¿Qué necesito para pescar desde kayak?',
        answer:
          'Un kayak estable, el chaleco salvavidas obligatorio, una forma de anclarte y un sistema para guardar el equipo. En la categoría encontrarás chollos de accesorios náuticos compatibles.',
      },
    ],
  },
}

export function getCategorySeo(slug: string): CategorySeoContent | undefined {
  return CATEGORY_SEO[slug]
}
