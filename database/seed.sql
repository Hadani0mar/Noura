insert into public.catalog_products(id,name,pack,price,image) values
(1,'مسحوق الأسرة 9 ك توماتيك',1,61,'/assets/product-1.png'),
(2,'مسحوق الأسرة كيس 7 ك — جودة عالية',2,181,'/assets/product-2.png'),
(3,'مسحوق الأسرة كيس 5 ك رغوي — جودة عالية',2,134,'/assets/product-3.png'),
(4,'مسحوق الأسرة كيس 4 ك — جودة عالية',3,196,'/assets/product-4.png'),
(5,'مسحوق الأسرة كيس 4.200 ك',5,165,'/assets/product-5.png'),
(6,'مسحوق الأسرة كيس 2.5 ك — جودة عالية',4,173,'/assets/product-6.png'),
(7,'مسحوق الأسرة كيس 2.250 ك',8,151,'/assets/product-7.png'),
(8,'مسحوق غسيل سطل 60 غسلة أصفر',1,51,'/assets/product-8.png'),
(9,'مسحوق غسيل سطل 60 غسلة أحمر',1,51,'/assets/product-9.png'),
(10,'سائل غسيل ملابس 10 لتر',1,53,'/assets/product-10.png'),
(11,'سائل غسيل ملابس 5 لتر الباهية',1,21,'/assets/product-11.png'),
(12,'سائل غسيل الأواني الأسرة 3 لتر',3,87,'/assets/product-12.png'),
(13,'سائل غسيل الأواني الأسرة 1080 جرام',12,117,'/assets/product-13.png'),
(14,'سائل غسيل الأواني الأسرة 600 جرام',12,85,'/assets/product-14.png'),
(15,'سائل غسيل ملابس الأسرة 5 لتر توماتك',2,87,'/assets/product-15.png'),
(16,'سائل غسيل ملابس الأسرة 5 لتر عادي',2,85,'/assets/product-16.png'),
(17,'سائل غسيل ملابس الأسرة 5 لتر نابولي',2,87,'/assets/product-17.png'),
(18,'ملين ومعطر ملابس سوفتر 5 لتر',2,80,'/assets/product-18.png'),
(19,'معطر ومنظف أرضيات 5 لتر',2,87,'/assets/product-19.png'),
(20,'مسحوق الأسرة 300 غ / رغوي',12,34,'/assets/product-20.png'),
(21,'مسحوق نجاح 300 غ / رغوي',12,34,'/assets/product-21.png'),
(22,'مسحوق الأسرة 160 غ / رغوي',20,34,'/assets/product-22.png'),
(23,'مسحوق الأسرة كيس 1.250 ك × 10',10,142,'/assets/product-23.png'),
(24,'مسحوق الأسرة كيس 1 ك — جودة عالية',6,128,'/assets/product-24.png'),
(25,'مناديل الأسرة المبللة',12,38,'/assets/product-25.png');

select setval(
  pg_get_serial_sequence('public.catalog_products','id'),
  coalesce((select max(id) from public.catalog_products), 0) + 1,
  false
);
