export { type Product };
export type { ProductCardProps };
export {mockProducts}

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  category?: string;
}

interface ProductCardProps {
    product:Product;
    onProductClick: (product: Product) => void;
}

const mockProducts: Product[] = [
  { 
    id: 1, 
    name: 'Смартфон Samsung Galaxy', 
    price: 25999,
    imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/ru/2202/gallery/ru-galaxy-s22-s901-412672-sm-s901bzgdser-530964917?$650_519_PNG$',
    description: 'Современный смартфон с отличной камерой и производительностью. Оснащен большим экраном, мощным процессором и долговечной батареей.',
    category: 'Смартфоны'
  },
  { 
    id: 2, 
    name: 'Ноутбук Apple MacBook Air', 
    price: 89990,
    imageUrl: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-space-gray-select-201810?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1633027804000',
    description: 'АААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААААА ПОМОГИТЕ.',
    category: 'Ноутбуки'
  },
  { 
    id: 3, 
    name: 'Наушники Sony WH-1000XM4', 
    price: 19990,
    imageUrl: 'https://www.sony.ru/image/9c81128986d0c2a4551be2b0535363d1?fmt=pjpeg&wid=330&bgcolor=FFFFFF&bgc=FFFFFF',
    description: 'Беспроводные наушники с продвинутым шумоподавлением. Обеспечивают кристально чистое звучание.',
    category: 'Аудио'
  },
  { 
    id: 4, 
    name: 'Часы Apple Watch Series', 
    price: 31990,
    imageUrl: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MPL63?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1660715723119',
    description: 'Умные часы для отслеживания активности и уведомлений. Помогают следить за здоровьем.',
    category: 'Гаджеты'
  },
  { 
    id: 5, 
    name: 'Планшет iPad Air', 
    price: 47990,
    imageUrl: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-air-select-wifi-blue-202203?wid=940&hei=1112&fmt=png-alpha&.v=1645066732666',
    description: 'Универсальный планшет для работы и развлечений. Поддерживает Apple Pencil.',
    category: 'Планшеты'
  },
  { 
    id: 6, 
    name: 'Фотоаппарат Canon EOS R6', 
    price: 159990,
    imageUrl: 'https://eu.canon/media/image/2020/07/09/552a4d4b93174e6e85a9a5e4537f0e13_EOS-R6-Front-angled.png',
    description: 'Профессиональная беззеркальная камера для съемки высококачественных фото и видео.',
    category: 'Фототехника'
  },
];