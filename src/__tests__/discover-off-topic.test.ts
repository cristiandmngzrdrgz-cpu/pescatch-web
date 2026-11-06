import { describe, it, expect } from 'vitest'
import { isFishingProduct, isOffTopic } from '@/lib/scraping-utils/filters'

describe('filtro off-topic del discover', () => {
  it('bloquea herramientas de jardín aunque la keyword lleve una marca de pesca', () => {
    expect(
      isFishingProduct(
        'RYOBI - Tijeras de Podar Eléctricas Inalámbricas a Batería 18V ONE+ 85cm Potentes - Usos Tala, Pequeña Poda y Desrame',
        'carrete ryobi',
      ),
    ).toBe(false)

    expect(
      isFishingProduct('Motoazada eléctrica 1500W para jardín, 40 cm de labor', 'caña ryobi'),
    ).toBe(false)

    expect(
      isFishingProduct('Robot cortacésped 800 m² con app', 'ryobi pesca'),
    ).toBe(false)
  })

  it('no bloquea material de pesca real', () => {
    expect(
      isFishingProduct(
        'RYOBI RANMI BT50 rueda de Jigging lento arrastre máximo 16KG 8 + 1BB carrete de pesca de Metal',
        'ryobi ranmi',
      ),
    ).toBe(true)

    expect(
      isFishingProduct('Shimano FX XT - Caña Spinning 2.10m 10-30g', 'caña shimano'),
    ).toBe(true)
  })

  it('isOffTopic detecta el ruido y deja pasar la pesca', () => {
    expect(isOffTopic('Cortacésped robot')).toBe(true)
    expect(isOffTopic('Desbrozadora a gasolina 43cc')).toBe(true)
    expect(isOffTopic('Carrete Daiwa Ninja LT 2500')).toBe(false)
    expect(isOffTopic('Kit de señuelos para lubina')).toBe(false)
  })
})
