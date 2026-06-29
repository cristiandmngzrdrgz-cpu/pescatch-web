$API = "https://pescatch-web.vercel.app/api/deals"

$deals = @(
  @{
    title = "DAIWA 23 Ninja LT - Carrete Spinning 3000C"
    slug = "daiwa-23-ninja-lt-carrete-spinning-3000c"
    description = "Carrete de spinning ultraligero con tecnología LT de Daiwa, 5 rodamientos, chasis de composite y ATD drag. Bobina de aluminio forjado. Ideal para spinning ligero y medio."
    originalPrice = 74.99; salePrice = 54.53; shippingCost = 3.99
    imageUrl = "https://m.media-amazon.com/images/I/71F8K7J9nFL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "carretes"; subcategory = "spinning"
    tags = @("spinning","ligero","daiwa","agua-dulce","agua-salada")
    stockStatus = "in_stock"; stockCount = 8; rating = 4.5; reviewCount = 340
    technicalSpecs = @{ "Relación" = "5.2:1"; "Rodamientos" = "5"; "Peso" = "215g"; "Freno" = "ATD Drag"; "Bobina" = "Aluminio forjado" }
    review = "El Daiwa Ninja LT es uno de los carretes más populares por su increíble ligereza a un precio ajustado. Perfecto para spinning ligero y medio tanto en agua dulce como salada. El sistema ATD Drag ofrece un frenado suave y progresivo. Muy recomendable para quien busca un carrete polivalente de calidad sin pagar una fortuna."
    pros = @("Ultraligero (215g)","Freno suave ATD","Aluminio forjado","Polivalente"); cons = @("No incluye bobina de repuesto","Capacidad de línea justa")
    featured = $true
  }
  @{
    title = "Abu Garcia Devil 562UL 10-30g - Caña Spinning"
    slug = "abu-garcia-devil-562ul-cana-spinning"
    description = "Caña de spinning de grafito con acción rápida, 2 piezas, para señuelos de 10-30g. Excelente para pesca a spinning de lubina y depredadores costeros."
    originalPrice = 45.99; salePrice = 29.99; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/31qzG9Kc0-L._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "canas"; subcategory = "spinning"
    tags = @("spinning","lubina","ligero","abu-garcia","grafito")
    stockStatus = "in_stock"; stockCount = 12; rating = 4.3; reviewCount = 180
    technicalSpecs = @{ "Longitud" = "1.68m"; "Rango señuelo" = "10-30g"; "Material" = "Grafito"; "Piezas" = "2"; "Acción" = "Rápida" }
    review = "La Abu Garcia Devil es un clásico entre los pescadores de spinning. Su acción rápida y sensibilidad en la puntera la hacen ideal para la pesca de lubina con vinilos y cucharillas. El grafito ofrece buena relación peso-potencia. Perfecta como caña de batalla para salidas frecuentes a la costa."
    pros = @("Muy sensible en punta","Acción rápida","Ligera y manejable","Calidad Abu Garcia"); cons = @("El mango podría ser más ergonómico","Puntera delicada en roca")
    featured = $false
  }
  @{
    title = "Vicloon Kit Señuelos Pesca 120 Piezas - Set Completo"
    slug = "vicloon-kit-senuelos-pesca-120-piezas"
    description = "Kit completo de 120 señuelos: cucharillas, vinilos, anzuelos, spinnerbaits, crankbaits y accesorios. Incluye caja organizadora. Ideal para iniciarse en la pesca a spinning."
    originalPrice = 29.99; salePrice = 19.99; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/81XQJ9WGNKL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "senuelos"; subcategory = "spinning"
    tags = @("señuelos","kit","lubina","agua-dulce","agua-salada","iniciacion")
    stockStatus = "in_stock"; stockCount = 50; rating = 4.2; reviewCount = 830
    technicalSpecs = @{ "Cantidad" = "120 piezas"; "Tipos" = "Cucharillas, vinilos, anzuelos, spinners"; "Incluye caja" = "Sí" }
    review = "Kit ideal para pescadores principiantes que quieren probar diferentes tipos de señuelos sin gastar mucho. La calidad es aceptable para el precio. Los vinilos vienen en colores variados y los anzuelos tienen buena penetración. La caja organizadora es un plus para tenerlo todo ordenado."
    pros = @("120 piezas por poco dinero","Variedad de señuelos","Incluye caja organizadora","Ideal para empezar"); cons = @("Calidad básica en algunos vinilos","Anzuelos mejorables en tamaños grandes")
    featured = $false
  }
  @{
    title = "Gonex Bobinador de Línea de Pesca - Anti Torsión"
    slug = "gonex-bobinador-linea-pesca"
    description = "Bobinador de línea profesional con sistema sin torsiones. Facilita la carga de línea en el carrete sin nudos ni enredos. Compacto y portátil."
    originalPrice = 24.99; salePrice = 16.99; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/715K5g-12VL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "accesorios"; subcategory = ""
    tags = @("accesorios","bobinador","carrete","mantenimiento")
    stockStatus = "in_stock"; stockCount = 25; rating = 4.4; reviewCount = 450
    technicalSpecs = @{ "Función" = "Bobinado y desenrollado"; "Anti-torsión" = "Sí"; "Material" = "Plástico ABS"; "Portátil" = "Sí" }
    review = "El Gonex es un accesorio que todo pescador debería tener. Bobinar el carrete sin torsiones alarga la vida de la línea y evita enredos frustrantes durante la jornada de pesca. Muy sencillo de usar y de tamaño compacto para llevar en la mochila."
    pros = @("Elimina torsiones","Fácil de usar","Compacto y portátil","Buena construcción"); cons = @("Ventosas de sujeción regulares","Algo ruidoso al girar")
    featured = $false
  }
  @{
    title = "TRUSCEND Señuelos Rooster Tail - Spinner Doble Cuchilla"
    slug = "truscend-senuelos-rooster-tail-spinner"
    description = "Set de 6 señuelos spinner con doble cuchilla, diseñados para trucha, lubina, lucioperca y salmón. Colores vibrantes con acción giratoria y vibraciones."
    originalPrice = 25.99; salePrice = 20.99; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/61RXJMLJfLL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "senuelos"; subcategory = "spinning"
    tags = @("señuelos","spinner","rooster-tail","lubina","trucha")
    stockStatus = "in_stock"; stockCount = 35; rating = 4.5; reviewCount = 2200
    technicalSpecs = @{ "Unidades" = "6"; "Tipo" = "Spinner doble cuchilla"; "Peso" = "5-15g"; "Agua dulce/salada" = "Sí" }
    review = "Los Rooster Tail de TRUSCEND son señuelos versátiles que capturan de todo. La doble cuchilla produce vibraciones y destellos irresistibles para los depredadores. Funcionan muy bien en ríos para trucha y en costa para lubina pequeña. Calidad superior a otros spinners chinos del mercado."
    pros = @("Doble cuchilla vibrante","Colores muy llamativos","2200 opiniones positivas","Polivalente"); cons = @("No incluye caja de transporte","Se enganchan fácil en algas")
    featured = $false
  }
  @{
    title = "DAIWA Caña Surfcasting Sweepfire 4.2m 100-200g"
    slug = "daiwa-sweepfire-cana-surfcasting-42m"
    description = "Caña de surfcasting Daiwa Sweepfire con acción potente para grandes lances. Fibra de carbono ligera y sensible. Para playa, muelle y roca."
    originalPrice = 67.99; salePrice = 53.62; shippingCost = 4.99
    imageUrl = "https://m.media-amazon.com/images/I/31QnKvKHa6L._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "canas"; subcategory = "surfcasting"
    tags = @("surfcasting","playa","daiwa","lance-pesado")
    stockStatus = "limited"; stockCount = 4; rating = 4.0; reviewCount = 23
    technicalSpecs = @{ "Longitud" = "4.2m"; "Peso lanzamiento" = "100-200g"; "Material" = "Fibra de carbono"; "Piezas" = "2" }
    review = "La Sweepfire es una caña de surfcasting de gama media con acción semiparabólica que permite buenos lances incluso con cebos pesados. El carbono ofrece buena respuesta. Es una caña sólida para el pescador que sale regularmente a playa y busca algo fiable sin gastar demasiado. Stock limitado."
    pros = @("Buena acción de lance","Carbono ligero","Marca de confianza","Potencia elevada"); cons = @("Poca disponibilidad","Guías mejorables")
    featured = $false
  }
  @{
    title = "Mitchell MX Surf - Carrete Surfcasting 10BB 8000"
    slug = "mitchell-mx-surf-carrete-surfcasting-8000"
    description = "Carrete de surfcasting con 10+1 rodamientos, chasis resistente a la corrosión y bobina de aluminio. Freno de 15kg para surfcasting exigente."
    originalPrice = 109.99; salePrice = 89.99; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/51yWzWVwARL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "carretes"; subcategory = "surfcasting"
    tags = @("surfcasting","carrete","surf","mitchell","agua-salada")
    stockStatus = "in_stock"; stockCount = 10; rating = 4.4; reviewCount = 103
    technicalSpecs = @{ "Rodamientos" = "10+1"; "Tamaño" = "8000"; "Material" = "Aleación anticorrosión"; "Peso" = "620g"; "Freno" = "15kg" }
    review = "El Mitchell MX Surf es un carrete diseñado específicamente para la pesca de surf. Su chasis anticorrosión y los 10 rodamientos ofrecen una rotación suave y duradera. La capacidad es amplia para líneas de surfcasting. Ideal para quien pesca regularmente en playa y necesita fiabilidad en condiciones de agua salada."
    pros = @("10 rodamientos muy suaves","Resistente al agua salada","Buena capacidad de línea","Freno potente 15kg"); cons = @("Peso elevado (620g)","Precio algo alto para principiantes")
    featured = $true
  }
  @{
    title = "WASAGA Señuelos Impresión 3D Hundidos 5 Piezas 20-80g"
    slug = "wasaga-senuelos-impresion-3d-jigging"
    description = "Señuelos de jigging con impresión 3D de altísimo detalle. 5 unidades en pesos 20/30/40/60/80g. Para agua salada profunda y dulce."
    originalPrice = 34.99; salePrice = 23.99; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/51B6PnT42HL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "senuelos"; subcategory = "jigging"
    tags = @("jigging","impresion-3d","profundo","lubina","depredadores")
    stockStatus = "in_stock"; stockCount = 20; rating = 4.2; reviewCount = 95
    technicalSpecs = @{ "Unidades" = "5"; "Pesos" = "20/30/40/60/80g"; "Tecnología" = "Impresión 3D"; "Agua" = "Salada y dulce" }
    review = "Estos jigs con impresión 3D destacan por el nivel de detalle en las escamas y ojos. La calidad de los colores y el realismo son superiores a los jigs pintados tradicionalmente. Funcionan muy bien para jigging vertical sobre fondos de 30-80m. Buena relación calidad-precio para un set variado de pesos."
    pros = @("Impresión 3D hiperrealista","Variedad de pesos","Colores duraderos","Anzuelos incluidos"); cons = @("Solo 5 unidades","Requiere caña de jigging específica")
    featured = $false
  }
  @{
    title = "Mitchell Mx1 Carrete Spinning 5500 - Agua Salada"
    slug = "mitchell-mx1-carrete-spinning-5500"
    description = "Carrete giratorio multiusos con 3+1 rodamientos, diseño resistente a la corrosión y freno delantero. Tamaño 5500 ideal para spinning pesado y surfcasting ligero."
    originalPrice = 42.99; salePrice = 36.72; shippingCost = 3.50
    imageUrl = "https://m.media-amazon.com/images/I/61OaKoWCOnL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "carretes"; subcategory = "spinning"
    tags = @("spinning","agua-salada","polivalente","mitchell")
    stockStatus = "in_stock"; stockCount = 18; rating = 4.3; reviewCount = 1373
    technicalSpecs = @{ "Rodamientos" = "3+1"; "Tamaño" = "5500"; "Relación" = "5.0:1"; "Peso" = "450g" }
    review = "El Mitchell MX1 es un carrete que ha vendido más de 30 millones de unidades por algo. Es sencillo, fiable y resistente. Para el pescador ocasional que busca un carrete todoterreno sin complicaciones, es la elección perfecta. El tamaño 5500 es ideal para spinning pesado y surfcasting ligero desde playa."
    pros = @("Fiabilidad probada","Resistente al agua salada","Precio ajustado","Mantenimiento sencillo"); cons = @("Solo 3 rodamientos","Rotación menos suave que modelos superiores")
    featured = $false
  }
  @{
    title = "Shakespeare Salt Surf Lowrider - Caña Surfcasting 4.2m"
    slug = "shakespeare-salt-surf-lowrider-cana-42m"
    description = "Caña ligera de carbono para surfcasting con acción cónica rápida y anillas lowrider que minimizan el roce de la línea. Para playa, muelle y estuario."
    originalPrice = 69.99; salePrice = 49.99; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/41iROO2FQAL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "canas"; subcategory = "surfcasting"
    tags = @("surfcasting","carbono","lowrider","shakespeare","playa")
    stockStatus = "limited"; stockCount = 3; rating = 4.2; reviewCount = 67
    technicalSpecs = @{ "Longitud" = "4.2m"; "Peso lanzamiento" = "100-200g"; "Material" = "Fibra de carbono"; "Anillas" = "Lowrider"; "Piezas" = "2" }
    review = "La Salt Surf Lowrider destaca por sus anillas lowrider que minimizan el roce de la línea y mejoran la distancia de lance. La construcción en carbono la hace ligera y sensible, perfecta para detectar picadas sutiles. Muy buena elección para quien quiere mejorar su distancia de lance sin gastar de más."
    pros = @("Anillas lowrider más distancia","Ligera de carbono","Buena sensibilidad","Acción rápida"); cons = @("Poca disponibilidad","Precio algo alto para gama media")
    featured = $false
  }
  @{
    title = "Outinhao Carrete Spinning 12BB 3000 - Alta Velocidad 6.2:1"
    slug = "outinhao-carrete-spinning-12bb-3000"
    description = "Carrete de spinning con 12+1 rodamientos, bobina de aluminio y relación de 6.2:1. Ideal para spinning rápido en agua dulce y salada. Excelente relación calidad-precio."
    originalPrice = 45.90; salePrice = 32.90; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/61Lh8N4dGUL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "carretes"; subcategory = "spinning"
    tags = @("spinning","12bb","alta-velocidad","polivalente","economico")
    stockStatus = "in_stock"; stockCount = 22; rating = 4.0; reviewCount = 250
    technicalSpecs = @{ "Rodamientos" = "12+1"; "Relación" = "6.2:1"; "Bobina" = "Aluminio"; "Peso" = "280g"; "Tamaño" = "3000" }
    review = "El Outinhao sorprende con 12 rodamientos a un precio muy ajustado. La rotación es sorprendentemente suave para esta gama de precio y la bobina de aluminio es un detalle inesperado. Perfecto como segundo carrete o para quien empieza en el spinning y quiere algo con buena relación de recogida sin gastar mucho."
    pros = @("12 rodamientos muy suaves","Bobina de aluminio","Alta velocidad 6.2:1","Precio imbatible"); cons = @("Marca poco conocida en España","Durabilidad a largo plazo por comprobar")
    featured = $false
  }
  @{
    title = "Chaqueta Impermeable Pesca Skogso - Acolchado Térmico"
    slug = "chaqueta-impermeable-pesca-skogso"
    description = "Chaqueta de pesca impermeable transpirable con acolchado térmico y múltiples bolsillos. Ideal para pesca en invierno y días de lluvia."
    originalPrice = 59.99; salePrice = 39.99; shippingCost = 0
    imageUrl = "https://m.media-amazon.com/images/I/81Nvjnp9ITL._AC_SX679_.jpg"
    storeId = "amazon"; storeName = "Amazon"; storeUrl = "https://amazon.es"; storeReputation = "good"; storeCommissionRate = 0.05
    category = "ropa"; subcategory = ""
    tags = @("ropa","impermeable","chaqueta","invierno","termico")
    stockStatus = "in_stock"; stockCount = 30; rating = 4.1; reviewCount = 89
    technicalSpecs = @{ "Material" = "Poliéster impermeable"; "Acolchado" = "Térmico"; "Transpirable" = "Sí"; "Bolsillos" = "Múltiples con cremallera" }
    review = "Una chaqueta de pesca asequible que cumple muy bien para salidas en días fríos y lluviosos. El acolchado térmico mantiene el calor sin ser demasiado voluminosa. Los bolsillos son amplios y prácticos para llevar el móvil, llaves y pequeñas cajas de señuelos. Buena compra para el pescador que pesca todo el año."
    pros = @("Impermeable y transpirable","Acolchado térmico","Muchos bolsillos","Buena relación calidad-precio"); cons = @("Tallas grandes, pedir una menos","Costuras reforzadas justas")
    featured = $false
  }
)

$count = 0
foreach ($deal in $deals) {
  $json = ConvertTo-Json -InputObject $deal -Depth 5 -Compress
  try {
    $result = Invoke-RestMethod -Uri $API -Method Post -Body $json -ContentType "application/json" -TimeoutSec 30
    $count++
    Write-Output "[$count/11] OK: $($deal.slug) -> $($result.id)"
  } catch {
    Write-Output "[$count/11] FAIL: $($deal.slug) -> $_"
  }
}

Write-Output "Done. Created $count deals."
