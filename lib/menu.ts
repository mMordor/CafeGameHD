// Single source of truth for the café menu. Prices are integer toman (the brief gave thousands).
// "description" is optional and editable; leave it out rather than inventing ingredients.
// export type MenuItem = { id: string; name: string; price: number; description?: string };
// export type MenuCategory = {
//   id: "cold" | "hot" | "food";
//   navLabel: string;
//   title: string;
//   heroEn: string;
//   tagline: string;
//   items: MenuItem[];
// };

export const menuCategories: MenuCategory[] = [
  {
    id: "cold",
    number: "۰۱",
    title: "نوشیدنی‌های سرد",
    subtitle: "خنکی، تا آخرین جرعه",
    description:
      "یک نفس تازه میان شلوغی روز؛ ترکیب میوه‌های تازه، یخ و یک عالمه حال خوب.",
    image: "/images/cold-drinks.png",
    imageLabel: "موهیتوی لیمو و نعنا",
    imageDescription: "خنک، تازه و پر از طراوت",
    theme: "cold",
    products: [
      {
        name: "موهیتو",
        description: "لیموی تازه، نعنا، شکر و سودا",
        price: 170000,
        label: "پیشنهاد کافه",
        icon: "drink",
      },
      {
        name: "آیس لاته",
        description: "اسپرسو دوبل، شیر سرد و یخ",
        price: 180000,
        label: "پیشنهاد کافه",
        icon: "drink",
      },
      {
        name: "آیس آمریکانو",
        description: "اسپرسو دوبل، شیر سرد و یخ",
        price: 140000,
        label: "پیشنهاد کافه",
        icon: "drink",
      },
      {
        name: "آب طالبی",
        description: "اسپرسو دوبل، شیر سرد و یخ",
        price: 140000,
        label: "پیشنهاد کافه",
        icon: "drink",
      },
      {
        name: "شیر موز",
        description: "اسپرسو دوبل، شیر سرد و یخ",
        price: 200000,
        label: "پیشنهاد کافه",
        icon: "drink",
      },
      {
        name: "انواع شیک",
        description: "اسپرسو دوبل، شیر سرد و یخ",
        price: 250000,
        label: "پیشنهاد کافه",
        icon: "drink",
      },
    ],
  },
  {
    id: "hot",
    number: "۰۲",
    title: "نوشیدنی‌های گرم",
    subtitle: "گرمای یک مکث دل‌چسب",
    description:
      "عطر قهوه‌ی تازه و یک فنجان آرامش؛ برای گیمرهای طولانی و لحظه‌هایی که مال خودتان است.",
    image: "/images/hot-drinks.png",
    imageLabel: "لاته‌ی مخصوص بازی",
    imageDescription: "یک فنجان انرژی برای ادامه‌ی بازی",
    theme: "hot",
    products: [
      {
        name: "لته",
        description: "اسپرسو و شیر بخار داده‌شده",
        price: 180000,
        label: "پیشنهاد کافه",
        icon: "coffee",
      },
      {
        name: "آمریکانو",
        description: "اسپرسو و شیر بخار داده‌شده",
        price: 150000,
        label: "پیشنهاد کافه",
        icon: "coffee",
      },
      {
        name: "کاپوچینو",
        description: "اسپرسو و شیر بخار داده‌شده",
        price: 175000,
        label: "پیشنهاد کافه",
        icon: "coffee",
      },
      {
        name: "چای ماسالا",
        description: "اسپرسو و شیر بخار داده‌شده",
        price: 180000,
        label: "پیشنهاد کافه",
        icon: "coffee",
      },
      {
        name: "آفاگاتو",
        description: "اسپرسو و شیر بخار داده‌شده",
        price: 210000,
        label: "پیشنهاد کافه",
        icon: "coffee",
      },
      {
        name: "چای کرک",
        description: "اسپرسو و شیر بخار داده‌شده",
        price: 180000,
        label: "پیشنهاد کافه",
        icon: "coffee",
      },
    ],
  },
  {
    id: "food",
    number: "۰۳",
    title: "غذا",
    subtitle: "وقت یک لقمه خوشمزه",
    description:
      "تازه، خوش‌عطر و حسابی وسوسه‌کننده؛ لقمه‌هایی که کنار نوشیدنی محبوبت، بیشتر می‌چسبند.",
    image: "/images/food.png",
    imageLabel: "چیکن پستو",
    imageDescription: "یک انتخاب خوشمزه برای بین بازی",
    theme: "food",
    products: [
      {
        name: "املت",
        description: "مرغ گریل، پستو و پنیر موزارلا",
        price: 380000,
        label: "پیشنهاد کافه",
        icon: "food",
      },
      {
        name: "سیب ویژه",
        description: "مرغ گریل، پستو و پنیر موزارلا",
        price: 320000,
        label: "پیشنهاد کافه",
        icon: "food",
      },
      {
        name: "سیب سوسیس",
        description: "مرغ گریل، پستو و پنیر موزارلا",
        price: 485000,
        label: "پیشنهاد کافه",
        icon: "food",
      },
      {
        name: "ظرف ناگت",
        description: "مرغ گریل، پستو و پنیر موزارلا",
        price: 285000,
        label: "پیشنهاد کافه",
        icon: "food",
      },
      {
        name: "اسنک",
        description: "مرغ گریل، پستو و پنیر موزارلا",
        price: 150000,
        label: "پیشنهاد کافه",
        icon: "food",
      },
      {
        name: "نودل",
        description: "مرغ گریل، پستو و پنیر موزارلا",
        price: 100000,
        label: "پیشنهاد کافه",
        icon: "food",
      },
      {
        name: "تیرامیسو",
        description: "مرغ گریل، پستو و پنیر موزارلا",
        price: 200000,
        label: "پیشنهاد کافه",
        icon: "food",
      },
    ],
  },
];



export type Product = {
  name: string;
  description: string;
  price: number;
  label: string;
  icon: "drink" | "coffee" | "food";
};

export type MenuCategory = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageLabel: string;
  imageDescription: string;
  theme: "cold" | "hot" | "food";
  products: Product[];
};

// export const menuCategories: MenuCategory[] = [
//   {
//     id: "cold",
//     number: "۰۱",
//     title: "نوشیدنی‌های سرد",
//     subtitle: "خنکی، تا آخرین جرعه",
//     description:
//       "یک نفس تازه میان شلوغی روز؛ ترکیب میوه‌های تازه، یخ و یک عالمه حال خوب.",
//     image: "/images/cold-drinks.png",
//     imageLabel: "موهیتوی لیمو و نعنا",
//     imageDescription: "خنک، تازه و پر از طراوت",
//     theme: "cold",
//     products: [
//       {
//         name: "موهیتو",
//         description: "لیموی تازه، نعنا، شکر و سودا",
//         price: 145000,
//         label: "پیشنهاد کافه",
//         icon: "drink",
//       },
//       {
//         name: "آیس لاته",
//         description: "اسپرسو دوبل، شیر سرد و یخ",
//         price: 155000,
//         label: "ملایم و متعادل",
//         icon: "drink",
//       },
//       {
//         name: "لیموناد توت‌فرنگی",
//         description: "توت‌فرنگی، لیمو و کمی شیرینی",
//         price: 165000,
//         label: "میوه‌ای و تازه",
//         icon: "drink",
//       },
//       {
//         name: "کلد برو",
//         description: "قهوه سرددم با طعم شکلات",
//         price: 140000,
//         label: "۱۴ ساعت دم‌آوری",
//         icon: "drink",
//       },
//     ],
//   },
//   {
//     id: "hot",
//     number: "۰۲",
//     title: "نوشیدنی‌های گرم",
//     subtitle: "گرمای یک مکث دل‌چسب",
//     description:
//       "عطر قهوه‌ی تازه و یک فنجان آرامش؛ برای گیمرهای طولانی و لحظه‌هایی که مال خودتان است.",
//     image: "/images/hot-drinks.png",
//     imageLabel: "لاته‌ی مخصوص بازی",
//     imageDescription: "یک فنجان انرژی برای ادامه‌ی بازی",
//     theme: "hot",
//     products: [
//       {
//         name: "اسپرسو دبل",
//         description: "دو شات قهوه با کرمای خوش‌عطر",
//         price: 95000,
//         label: "ترکیب اختصاصی",
//         icon: "coffee",
//       },
//       {
//         name: "کاپوچینو",
//         description: "اسپرسو، شیر و فوم مخملی",
//         price: 135000,
//         label: "کلاسیک و دوست‌داشتنی",
//         icon: "coffee",
//       },
//       {
//         name: "کافه لاته",
//         description: "اسپرسو و شیر بخار داده‌شده",
//         price: 145000,
//         label: "پیشنهاد کافه",
//         icon: "coffee",
//       },
//       {
//         name: "هات چاکلت",
//         description: "شکلات غلیظ با شیر داغ",
//         price: 155000,
//         label: "شکلات واقعی",
//         icon: "coffee",
//       },
//     ],
//   },
//   {
//     id: "food",
//     number: "۰۳",
//     title: "غذا",
//     subtitle: "وقت یک لقمه خوشمزه",
//     description:
//       "تازه، خوش‌عطر و حسابی وسوسه‌کننده؛ لقمه‌هایی که کنار نوشیدنی محبوبت، بیشتر می‌چسبند.",
//     image: "/images/food.png",
//     imageLabel: "چیکن پستو",
//     imageDescription: "یک انتخاب خوشمزه برای بین بازی",
//     theme: "food",
//     products: [
//       {
//         name: "چیکن پستو",
//         description: "مرغ گریل، پستو و پنیر موزارلا",
//         price: 285000,
//         label: "پیشنهاد کافه",
//         icon: "food",
//       },
//       {
//         name: "پینی زامبون",
//         description: "ژامبون، پنیر گودا و سس خردل",
//         price: 265000,
//         label: "گرم و برشته",
//         icon: "food",
//       },
//       {
//         name: "کروسان بوقلمون",
//         description: "کروسان کره‌ای، بوقلمون و کاهو",
//         price: 275000,
//         label: "سبک و خوش‌طعم",
//         icon: "food",
//       },
//       {
//         name: "تست آووکادو",
//         description: "آووکادو، تخم‌مرغ و نان خمیرترش",
//         price: 245000,
//         label: "انتخاب گیاهی",
//         icon: "food",
//       },
//     ],
//   },
// ];