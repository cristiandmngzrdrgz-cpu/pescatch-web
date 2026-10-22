import { describe, it, expect } from 'vitest'
import { categorizeProduct } from '@/lib/scraping-utils/categorizer'

describe('categorizeProduct', () => {
  it('clasifica carretes por su nombre, no por la palabra spinning', () => {
    expect(categorizeProduct('DAIWA 23 Ninja LT Carrete Spinning 3000C')).toBe('carretes')
    expect(categorizeProduct('SHIMANO Ultegra 14000 XSE - Carrete Surfcasting')).toBe('carretes')
    expect(categorizeProduct('Okuma Aria Carrete Giratorio Multiuso')).toBe('carretes')
    expect(categorizeProduct('OKUMA Reels Surf 8K Spinning 5Bb+1Rb 4.7:1')).toBe('carretes')
  })

  it('no mete cañas en carretes aunque el título diga spinning o jig', () => {
    expect(categorizeProduct('Abu Garcia ORRA Predator Spinning Rod - Premium caña de Pescar')).toBe('canas')
    expect(categorizeProduct('Mitchell Tanager SW Surf Spinning Caña | Blank de Grafito')).toBe('canas')
    expect(categorizeProduct('Caña de Pescar MIFINE JIG TRAINING SPIN, Señuelo 3-14g')).toBe('canas')
    expect(categorizeProduct('Shimano FX XT 2,10 m Angelrute Spinnrute Forelle Barsch')).toBe('canas')
    expect(categorizeProduct('NUEVA Caña de Pescar Telescópica para Spinning, Fly, Carpa y Feeder')).toBe('canas')
  })

  it('manda a accesorios los complementos que mencionan caña o carrete', () => {
    expect(categorizeProduct('Estuche para Carretes de Pesca de 8 Compartimentos')).toBe('accesorios')
    expect(categorizeProduct('Grasa para Carretes de Pesca ZORILYNX 100g')).toBe('accesorios')
    expect(categorizeProduct('Kit de rodamientos de bolas de acero inoxidable para carrete')).toBe('accesorios')
    expect(categorizeProduct('Soporte para caña de Kayak, nueva actualización')).toBe('accesorios')
    expect(categorizeProduct('Bolsa para Carrete de Pesca Rígida, Caja Protectora')).toBe('accesorios')
    expect(categorizeProduct('Carbono de 70 mm para mango de carrete giratorio, brazo único')).toBe('accesorios')
  })

  it('reconoce señuelos sin confundirlos con cañas por el jig', () => {
    expect(categorizeProduct('Juego de 8 señuelos horizontales Egi de 8 cm con luz UV')).toBe('senuelos')
    expect(categorizeProduct('QXO 50 unids/lote Swimbait señuelo suave de silicona')).toBe('senuelos')
    expect(categorizeProduct('Rapala Original Floating Minnow 9cm - Señuelo de Pesca')).toBe('senuelos')
    expect(categorizeProduct('5 Piezas Señuelos de Pesca Spinning, Señuelos Artificiales')).toBe('senuelos')
  })

  it('separa ropa y náutica del resto', () => {
    expect(categorizeProduct('Navis - Traje de Lluvia para Hombre, Resistente al Agua')).toBe('ropa')
    expect(categorizeProduct('Nuevas gafas tácticas de 4 lentes polarizadas')).toBe('ropa')
    expect(categorizeProduct('Soporte de Kayak para caña con soporte de caña')).toBe('accesorios')
  })

  it('usa accesorios como cajón de sastre', () => {
    expect(categorizeProduct('Leydun Micro hilo de pescar trenzado PE 100m')).toBe('accesorios')
    expect(categorizeProduct('Caja de aparejos de pesca de gran capacidad')).toBe('accesorios')
    expect(categorizeProduct('Producto sin palabras clave conocidas')).toBe('accesorios')
  })
})
