-- Seed 12 main Nigerian categories with lucide-react icons
INSERT INTO categories (name, icon, display_order) VALUES
  ('Electronics', 'Smartphone', 1),
  ('Fashion', 'Shirt', 2),
  ('Food', 'UtensilsCrossed', 3),
  ('Real Estate', 'Building2', 4),
  ('Vehicles', 'Car', 5),
  ('Services', 'Wrench', 6),
  ('Jobs', 'Briefcase', 7),
  ('Agriculture', 'Wheat', 8),
  ('Beauty', 'Sparkles', 9),
  ('Education', 'GraduationCap', 10),
  ('Events', 'Calendar', 11),
  ('Home', 'Home', 12);

-- Seed subcategories for Electronics
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Electronics'
) c
CROSS JOIN (
  VALUES 
    ('Phones', 1),
    ('Laptops', 2),
    ('TVs', 3),
    ('Accessories', 4),
    ('Tablets', 5),
    ('Cameras', 6),
    ('Gaming Consoles', 7),
    ('Audio Equipment', 8)
) AS s(subcategory, row_number);

-- Seed subcategories for Fashion
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Fashion'
) c
CROSS JOIN (
  VALUES 
    ('Clothing', 1),
    ('Shoes', 2),
    ('Bags', 3),
    ('Jewelry', 4),
    ('Watches', 5),
    ('Accessories', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Food
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Food'
) c
CROSS JOIN (
  VALUES 
    ('Groceries', 1),
    ('Restaurants', 2),
    ('Catering', 3),
    ('Beverages', 4),
    ('Snacks', 5),
    ('Fresh Produce', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Real Estate
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Real Estate'
) c
CROSS JOIN (
  VALUES 
    ('Houses', 1),
    ('Land', 2),
    ('Apartments', 3),
    ('Commercial', 4),
    ('Short Let', 5),
    ('Office Space', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Vehicles
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Vehicles'
) c
CROSS JOIN (
  VALUES 
    ('Cars', 1),
    ('Motorcycles', 2),
    ('Trucks', 3),
    ('Parts', 4),
    ('Buses', 5),
    ('Bicycles', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Services
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Services'
) c
CROSS JOIN (
  VALUES 
    ('Plumbing', 1),
    ('Electrical', 2),
    ('Cleaning', 3),
    ('Repairs', 4),
    ('Moving', 5),
    ('Painting', 6),
    ('Carpentry', 7),
    ('Security', 8)
) AS s(subcategory, row_number);

-- Seed subcategories for Jobs
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Jobs'
) c
CROSS JOIN (
  VALUES 
    ('Full-time', 1),
    ('Part-time', 2),
    ('Freelance', 3),
    ('Internships', 4),
    ('Contract', 5),
    ('Remote', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Agriculture
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Agriculture'
) c
CROSS JOIN (
  VALUES 
    ('Crops', 1),
    ('Livestock', 2),
    ('Equipment', 3),
    ('Produce', 4),
    ('Seeds', 5),
    ('Fertilizers', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Beauty
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Beauty'
) c
CROSS JOIN (
  VALUES 
    ('Salons', 1),
    ('Makeup', 2),
    ('Skincare', 3),
    ('Barbering', 4),
    ('Hair Products', 5),
    ('Spa Services', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Education
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Education'
) c
CROSS JOIN (
  VALUES 
    ('Tutoring', 1),
    ('Courses', 2),
    ('Schools', 3),
    ('Training', 4),
    ('Books', 5),
    ('Online Classes', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Events
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Events'
) c
CROSS JOIN (
  VALUES 
    ('Venues', 1),
    ('Planning', 2),
    ('Catering', 3),
    ('Entertainment', 4),
    ('Photography', 5),
    ('Decoration', 6)
) AS s(subcategory, row_number);

-- Seed subcategories for Home
INSERT INTO subcategories (category_id, name, display_order)
SELECT id, subcategory, row_number FROM (
  SELECT id FROM categories WHERE name = 'Home'
) c
CROSS JOIN (
  VALUES 
    ('Furniture', 1),
    ('Appliances', 2),
    ('Decor', 3),
    ('Garden', 4),
    ('Kitchen', 5),
    ('Bedding', 6)
) AS s(subcategory, row_number);


-- Insert Nigerian states (all 36 states + FCT)
INSERT INTO nigerian_states (name) VALUES
  ('Abia'),
  ('Adamawa'),
  ('Akwa Ibom'),
  ('Anambra'),
  ('Bauchi'),
  ('Benue'),
  ('Borno'),
  ('Bayelsa'),
  ('Cross River'),
  ('Delta'),
  ('Ebonyi'),
  ('Edo'),
  ('Ekiti'),
  ('Enugu'),
  ('Federal Capital Territory'),
  ('Gombe'),
  ('Imo'),
  ('Jigawa'),
  ('Kebbi'),
  ('Kaduna'),
  ('Kano'),
  ('Kogi'),
  ('Katsina'),
  ('Kwara'),
  ('Lagos'),
  ('Nassarawa'),
  ('Niger'),
  ('Ogun'),
  ('Ondo'),
  ('Osun'),
  ('Oyo'),
  ('Plateau'),
  ('Rivers'),
  ('Sokoto'),
  ('Taraba'),
  ('Yobe'),
  ('Zamfara');

-- Insert LGAs for Abia
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Abia'
) s
CROSS JOIN (
  VALUES
    ('Aba North'),
    ('Aba South'),
    ('Arochukwu'),
    ('Bende'),
    ('Ikwuano'),
    ('Isiala Ngwa North'),
    ('Isiala Ngwa South'),
    ('Isukwuato'),
    ('Obi Ngwa'),
    ('Ohafia'),
    ('Osisioma'),
    ('Ugwunagbo'),
    ('Ukwa East'),
    ('Ukwa West'),
    ('Umuahia North'),
    ('Umuahia South'),
    ('Umu Nneochi')
) AS l(lga);

-- Insert LGAs for Adamawa
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Adamawa'
) s
CROSS JOIN (
  VALUES
    ('Demsa'),
    ('Fufure'),
    ('Ganye'),
    ('Gayuk'),
    ('Girei'),
    ('Gombi'),
    ('Jada'),
    ('Lamurde'),
    ('Madagali'),
    ('Maiha'),
    ('Mayo-Belwa'),
    ('Michika'),
    ('Mubi South'),
    ('Numan'),
    ('Shelleng'),
    ('Song'),
    ('Toungo'),
    ('Yola North'),
    ('Yola South'),
    ('Hung')
) AS l(lga);

-- Insert LGAs for Akwa Ibom
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Akwa Ibom'
) s
CROSS JOIN (
  VALUES
    ('Abak'),
    ('Eastern Obolo'),
    ('Eket'),
    ('Esit Eket'),
    ('Essien Udim'),
    ('Etim Ekpo'),
    ('Etinan'),
    ('Ibeno'),
    ('Ibesikpo Asutan'),
    ('Ibiono Ibom'),
    ('Ika'),
    ('Ikono'),
    ('Ikot Abasi'),
    ('Ikot Ekpene'),
    ('Ini'),
    ('Itu'),
    ('Mbo'),
    ('Mkpat-Enin'),
    ('Nsit-Atai'),
    ('Nsit Ibom'),
    ('Nsit Ubium'),
    ('Obot Akara'),
    ('Okobo'),
    ('Onna'),
    ('Oruk Anam'),
    ('Oron'),
    ('Udung-Uko'),
    ('Ukanafun'),
    ('Uruan'),
    ('Urue Offoung/Oruko'),
    ('Uyo')
) AS l(lga);

-- Insert LGAs for Anambra
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Anambra'
) s
CROSS JOIN (
  VALUES
    ('Aguata'),
    ('Anambra East'),
    ('Anambra-West'),
    ('Anaocha'),
    ('Awka-North'),
    ('Awka-South'),
    ('Ayamelum'),
    ('Dunukofia'),
    ('Ekwusigo'),
    ('Idemili-North'),
    ('Idemili-South'),
    ('Ihiala'),
    ('Njikoka'),
    ('Nnewi-North'),
    ('Nnewi-South'),
    ('Ogbaru'),
    ('Onitsha-North'),
    ('Onitsha-South'),
    ('Orumba-North'),
    ('Orumba-South'),
    ('Oyi')
) AS l(lga);

-- Insert LGAs for Bauchi
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Bauchi'
) s
CROSS JOIN (
  VALUES
    ('Alkaleri'),
    ('Bauchi'),
    ('Bogoro'),
    ('Damban'),
    ('Darazo'),
    ('Dass'),
    ('Gamawa'),
    ('Ganjuwa'),
    ('Giade'),
    ('Itas/Gadau'),
    ('Jama''Are'),
    ('Katagum'),
    ('Kirfi'),
    ('Misau'),
    ('Ningi'),
    ('Shira'),
    ('Tafawa-Balewa'),
    ('Toro'),
    ('Warji'),
    ('Zaki')
) AS l(lga);

-- Insert LGAs for Benue
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Benue'
) s
CROSS JOIN (
  VALUES
    ('Ado'),
    ('Agatu'),
    ('Apa'),
    ('Buruku'),
    ('Gboko'),
    ('Guma'),
    ('Gwer-East'),
    ('Gwer-West'),
    ('Katsina-Ala'),
    ('Konshisha'),
    ('Kwande'),
    ('Logo'),
    ('Makurdi'),
    ('Ogbadibo'),
    ('Ohimini'),
    ('Oju'),
    ('Okpokwu'),
    ('Otukpo'),
    ('Oturkpa'),
    ('Tarka'),
    ('Ukum'),
    ('Ushongo'),
    ('Vandekya')
) AS l(lga);

-- Insert LGAs for Borno
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Borno'
) s
CROSS JOIN (
  VALUES
    ('Abadam'),
    ('Askira-Uba'),
    ('Bama'),
    ('Bayo'),
    ('Biu'),
    ('Chibok'),
    ('Damboa'),
    ('Dikwa'),
    ('Gubio'),
    ('Guzamala'),
    ('Gwoza'),
    ('Hawul'),
    ('Jere'),
    ('Kaga'),
    ('Kala/Balge'),
    ('Konduga'),
    ('Kukawa'),
    ('Kwaya-Kusar'),
    ('Mafa'),
    ('Magumeri'),
    ('Maiduguri'),
    ('Marte'),
    ('Mobbar'),
    ('Monguno'),
    ('Ngala'),
    ('Nganzai'),
    ('Shani')
) AS l(lga);

-- Insert LGAs for Bayelsa
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Bayelsa'
) s
CROSS JOIN (
  VALUES
    ('Brass'),
    ('Ekeremor'),
    ('Kolokuma/Opkuma'),
    ('Nembe'),
    ('Ogbia'),
    ('Sagbama'),
    ('Southern-Ijaw'),
    ('Yenegoa')
) AS l(lga);

-- Insert LGAs for Cross River
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Cross River'
) s
CROSS JOIN (
  VALUES
    ('Abi'),
    ('Akamkpa'),
    ('Akpabuyo'),
    ('Bakassi'),
    ('Bekwara'),
    ('Biase'),
    ('Boki'),
    ('Calabar-Municipal'),
    ('Calabar-South'),
    ('Etung'),
    ('Ikom'),
    ('Obanliku'),
    ('Obubra'),
    ('Obudu'),
    ('Odukpani'),
    ('Ogoja'),
    ('Yakurr'),
    ('Yala')
) AS l(lga);

-- Insert LGAs for Delta
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Delta'
) s
CROSS JOIN (
  VALUES
    ('Aniocha North'),
    ('Aniocha-South'),
    ('Bomadi'),
    ('Burutu'),
    ('Ethiope-East'),
    ('Ethiope-West'),
    ('Ika-North-East'),
    ('Ika-South'),
    ('Isoko-North'),
    ('Isoko-South'),
    ('Ndokwa-East'),
    ('Ndokwa-West'),
    ('Okpe'),
    ('Oshielli-North'),
    ('Oshimili-South'),
    ('Patani'),
    ('Sapele'),
    ('Udu'),
    ('Ughelli-North'),
    ('Ughelli-South'),
    ('Ukwuani'),
    ('Uvwei'),
    ('Warri-North'),
    ('Warri-South'),
    ('Warri-South West')
) AS l(lga);

-- Insert LGAs for Ebonyi
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Ebonyi'
) s
CROSS JOIN (
  VALUES
    ('Abakaliki'),
    ('Afikpo-North'),
    ('Afikpo-South(Edda)'),
    ('Ebonyi'),
    ('Ezza-North'),
    ('Ezza-South'),
    ('Ikwo'),
    ('Ishielu'),
    ('Ivo'),
    ('Izzi'),
    ('Ohaozara'),
    ('Ohaukwu'),
    ('Onicha')
) AS l(lga);

-- Insert LGAs for Edo
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Edo'
) s
CROSS JOIN (
  VALUES
    ('Akoko Edo'),
    ('Egor'),
    ('Esan-Central'),
    ('Esan-North-East'),
    ('Esan-South-East'),
    ('Esan-West'),
    ('Etsako-Central'),
    ('Etsako-East'),
    ('Etsako-West'),
    ('Igueben'),
    ('Ikpoba-Okha'),
    ('Orhionmwon'),
    ('Ologbo'),
    ('Oredo'),
    ('Ovia-North-East'),
    ('Ovia-South-West'),
    ('Owan East'),
    ('Owan-West'),
    ('Uhunmwonde')
) AS l(lga);

-- Insert LGAs for Ekiti
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Ekiti'
) s
CROSS JOIN (
  VALUES
    ('Ado-Ekiti'),
    ('Efon'),
    ('Ekiti-East'),
    ('Ekiti-South-West'),
    ('Ekiti-West'),
    ('Emure/Ise/Orun'),
    ('Gbonyin'),
    ('Ido-Osi'),
    ('Ijero'),
    ('Ikere'),
    ('Ikole'),
    ('Ilejemeje'),
    ('Irepodun/Ifelodun'),
    ('Ise/Orun'),
    ('Moba'),
    ('Oye')
) AS l(lga);

-- Insert LGAs for Enugu
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Enugu'
) s
CROSS JOIN (
  VALUES
    ('Aninri'),
    ('Awgu'),
    ('Enugu-East'),
    ('Enugu-North'),
    ('Enugu-South'),
    ('Ezeagu'),
    ('Igbo-Etiti'),
    ('Igbo-Eze-North'),
    ('Igbo-Eze-South'),
    ('Isi-Uzo'),
    ('Nkanu-East'),
    ('Nkanu-West'),
    ('Nsukka'),
    ('Oji-River'),
    ('Udenu'),
    ('Udi'),
    ('Uzo-Uwani')
) AS l(lga);

-- Insert LGAs for Federal Capital Territory
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Federal Capital Territory'
) s
CROSS JOIN (
  VALUES
    ('Abaji'),
    ('Abuja Municipal Area Council'),
    ('Bwari'),
    ('Gwagwalada'),
    ('Kuje'),
    ('Kwali')
) AS l(lga);

-- Insert LGAs for Gombe
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Gombe'
) s
CROSS JOIN (
  VALUES
    ('Akko'),
    ('Balanga'),
    ('Billiri'),
    ('Dukku'),
    ('Funakaye'),
    ('Gombe'),
    ('Kaltungo'),
    ('Kwami'),
    ('Nafada/Bajoga'),
    ('Shomgom'),
    ('Yamaltu/Deba')
) AS l(lga);

-- Insert LGAs for Imo
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Imo'
) s
CROSS JOIN (
  VALUES
    ('Aboh-Mbaise'),
    ('Ahiazu-Mbaise'),
    ('Ehime-Mbano'),
    ('Ezinihitte'),
    ('Ideato-North'),
    ('Ideato-South'),
    ('Ihitte/Uboma'),
    ('Ikeduru'),
    ('Isiala-Mbano'),
    ('Isu'),
    ('Mbaitoli'),
    ('Ngor-Okpala'),
    ('Njaba'),
    ('Nkwerre'),
    ('Nwangele'),
    ('Obowo'),
    ('Oguta'),
    ('Ohaji-Egbema'),
    ('Okigwe'),
    ('Onuimo'),
    ('Orlu'),
    ('Orsu'),
    ('Oru-East'),
    ('Oru-West'),
    ('Owerri-Municipal'),
    ('Owerri-North'),
    ('Owerri-West'),
    ('Unuimo')
) AS l(lga);

-- Insert LGAs for Jigawa
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Jigawa'
) s
CROSS JOIN (
  VALUES
    ('Auyo'),
    ('Babura'),
    ('Biriniwa'),
    ('Birnin-Kudu'),
    ('Bosuwa'),
    ('Buji'),
    ('Dutse'),
    ('Gagarawa'),
    ('Garki'),
    ('Gumel'),
    ('Guri'),
    ('Gwaram'),
    ('Gwiwa'),
    ('Hadejia'),
    ('Jahun'),
    ('Kafin-Hausa'),
    ('Kaugama'),
    ('Kazaure'),
    ('Kir Kasamma'),
    ('Kiyawa'),
    ('Maigatari'),
    ('Malam MadOri'),
    ('Miga'),
    ('Ringim'),
    ('Roni'),
    ('Sule Tankarkar'),
    ('Taura'),
    ('Yankwashi')
) AS l(lga);

-- Insert LGAs for Kebbi
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Kebbi'
) s
CROSS JOIN (
  VALUES
    (' Aleiro'),
    ('Arewa'),
    ('Argungu'),
    ('Augie'),
    ('Bagudo'),
    ('Birnin Kebbi'),
    ('Bunza'),
    ('Dandi'),
    ('Fakai'),
    ('Gwandu'),
    ('Jega'),
    ('Kalgo'),
    ('Koko/Besse'),
    ('Maiyama'),
    ('Ngaski'),
    ('Sakaba'),
    ('Shanga'),
    ('Suru'),
    ('Danko-Wasagu'),
    ('Yauri'),
    ('Zuru')
) AS l(lga);

-- Insert LGAs for Kaduna
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Kaduna'
) s
CROSS JOIN (
  VALUES
    ('Birnin Gwari'),
    ('Chikun'),
    ('Giwa'),
    ('Igabi'),
    ('Ikara'),
    ('Jaba'),
    ('Jema''a'),
    ('Kachia'),
    ('Kaduna North'),
    ('Kaduna South'),
    ('Kagarko'),
    ('Kajuru'),
    ('Kaura'),
    ('Kauru'),
    ('Kubau'),
    ('Kudan'),
    ('Lere'),
    ('Makarfi'),
    ('Sabon Gari'),
    ('Sanga'),
    ('Soba'),
    ('Zangon Kataf'),
    ('Zaria')
) AS l(lga);

-- Insert LGAs for Kano
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Kano'
) s
CROSS JOIN (
  VALUES
    ('Ajingi'),
    ('Albasu'),
    ('Bagwai'),
    ('Bebeji'),
    ('Bichi'),
    ('Bunkure'),
    ('Dala'),
    ('Dambatta'),
    ('Dawakin-Kudu'),
    ('Dawakin-Tofa'),
    ('Doguwa'),
    ('Fagge'),
    ('Gabasawa'),
    ('Garko'),
    ('Garun-Mallam'),
    ('Gaya'),
    ('Gezawa'),
    ('Gwale'),
    ('Gwarzo'),
    ('Kabo'),
    ('Kano-Municipal'),
    ('Karaye'),
    ('Kibiya'),
    ('Kiru'),
    ('Kumbotso'),
    ('Kunchi'),
    ('Kura'),
    ('Madobi'),
    ('Makoda'),
    ('Minjibir'),
    ('Nasarawa'),
    ('Rano'),
    ('Rimin-Gado'),
    ('Rogo'),
    ('Shanono'),
    ('Sumaila'),
    ('Takai'),
    ('Tarauni'),
    ('Tofa'),
    ('Tsanyawa'),
    ('Tudun-Wada'),
    ('Ungogo'),
    ('Warawa'),
    ('Wudil')
) AS l(lga);

-- Insert LGAs for Kogi
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Kogi'
) s
CROSS JOIN (
  VALUES
    ('Adavi'),
    ('Ajaokuta'),
    ('Ankpa'),
    ('Bassa'),
    ('Dekina'),
    ('Ibaji'),
    ('Idah'),
    ('Igalamela Odulo'),
    ('Ijumu'),
    ('Kabba/Bunu'),
    ('Kogi'),
    ('Lokoja'),
    ('Mopa Muro'),
    ('Ofu'),
    ('Ogori/Magongo'),
    ('Okehi'),
    ('Okene'),
    ('Olamaboro'),
    ('Omala'),
    ('Yagba-East'),
    ('Yagba-West')
) AS l(lga);

-- Insert LGAs for Katsina
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Katsina'
) s
CROSS JOIN (
  VALUES
    ('Bakori'),
    ('Batagarawa'),
    ('Batsari'),
    ('Baure'),
    ('Bindawa'),
    ('Charanchi'),
    ('Dan-Musa'),
    ('Dandume'),
    ('Danja'),
    ('Daura'),
    ('Dutsi'),
    ('Dutsin Ma'),
    ('Faskari'),
    ('Funtua'),
    ('Ingawa'),
    ('Jibia'),
    ('Kafur'),
    ('Kaita'),
    ('Kankara'),
    ('Kankia'),
    ('Katsina'),
    ('Kurfi'),
    ('Kusada'),
    ('Mai''Adua'),
    ('Malumfashi'),
    ('Mani'),
    ('Mashi'),
    ('Matazu'),
    ('Musawa'),
    ('Rimi'),
    ('Sabuwa'),
    ('Safana'),
    ('Sandamu'),
    ('Zango')
) AS l(lga);

-- Insert LGAs for Kwara
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Kwara'
) s
CROSS JOIN (
  VALUES
    ('Asa'),
    ('Baruten'),
    ('Edu'),
    ('Ekiti'),
    ('Ifelodun'),
    ('Ilorin south'),
    ('Ilorin west'),
    ('Ilorin east'),
    ('Irepodun'),
    ('Isin'),
    ('Kaiama'),
    ('Moro'),
    ('Offa'),
    ('Oke ero'),
    ('Oyun'),
    ('Pategi')
) AS l(lga);

-- Insert LGAs for Lagos
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Lagos'
) s
CROSS JOIN (
  VALUES
    ('Agege'),
    ('Ajeromi-Ifelodun'),
    ('Alimosho'),
    ('Amuwo-Odofin'),
    ('Apapa'),
    ('Badagry'),
    ('Epe'),
    ('Eti-Osa'),
    ('Ibeju-Lekki'),
    ('Ifako-Ijaiye'),
    ('Ikeja'),
    ('Ikorodu'),
    ('Kosofe'),
    ('Lagos-Island'),
    ('Lagos-Mainland'),
    ('Mushin'),
    ('Ojo'),
    ('Oshodi-Isolo'),
    ('Shomolu'),
    ('Surulere')
) AS l(lga);

-- Insert LGAs for Nassarawa
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Nassarawa'
) s
CROSS JOIN (
  VALUES
    ('Akwanga'),
    ('Awe'),
    ('Doma'),
    ('Karu'),
    ('Keana'),
    ('Keffi'),
    ('Kokona'),
    ('Lafia'),
    ('Nassawara'),
    ('Nassawara Eggon'),
    ('Obi'),
    ('Toto'),
    ('Wambu')
) AS l(lga);

-- Insert LGAs for Niger
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Niger'
) s
CROSS JOIN (
  VALUES
    ('Agaie'),
    ('Agwara'),
    ('Bida'),
    ('Borgu'),
    ('Bosso'),
    ('Chanchaga'),
    ('Edati'),
    ('Gbako'),
    ('Gurara'),
    ('Katcha'),
    ('Kontagora'),
    ('Lapai'),
    ('Lavun'),
    ('Magama'),
    ('Mariga'),
    ('Mashegu'),
    ('Mokwa'),
    ('Moya'),
    ('Paikoro'),
    ('Rafi'),
    ('Rijau'),
    ('Shiroro'),
    ('Suleja'),
    ('Tafa'),
    ('Wushishi')
) AS l(lga);

-- Insert LGAs for Ogun
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Ogun'
) s
CROSS JOIN (
  VALUES
    ('Abeokuta-North'),
    ('Abeokuta-South'),
    ('Ado-Odo/Ota'),
    ('Ewekoro'),
    ('Ifo'),
    ('Ijebu-East'),
    ('Ijebu-North'),
    ('Ijebu-North-East'),
    ('Ijebu-Ode'),
    ('Ikenne'),
    ('Imeko-Afon'),
    ('Ipokia'),
    ('Obafemi-Owode'),
    ('Odeda'),
    ('Odogbolu'),
    ('Ogun-Waterside'),
    ('Remo-North'),
    ('Shagamu'),
    ('Yewa North'),
    ('Yewa South')
) AS l(lga);

-- Insert LGAs for Ondo
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Ondo'
) s
CROSS JOIN (
  VALUES
    ('Akoko-North-East'),
    ('Akoko-North-West'),
    ('Akoko-South-East'),
    ('Akoko-South-West'),
    ('Akure-North'),
    ('Akure-South'),
    ('Ese-Odo'),
    ('Idanre'),
    ('Ifedore'),
    ('Ilaje'),
    ('Ile-Oluji/Okeigbo'),
    ('Irele'),
    ('Odigbo'),
    ('Okiti-Pupa'),
    ('Ondo West'),
    ('Ondo-East'),
    ('Ose'),
    ('Owo')
) AS l(lga);

-- Insert LGAs for Osun
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Osun'
) s
CROSS JOIN (
  VALUES
    ('Aiyeda-Ade'),
    ('Aiyedire'),
    ('Atakumosa East'),
    ('Atakumosa West'),
    ('Boluwaduro'),
    ('Boripe'),
    ('Ede South'),
    ('Ede North'),
    ('Egbedore'),
    ('Ejigbo'),
    ('Ife Central'),
    ('Ife East'),
    ('Ife North'),
    ('Ife-South'),
    ('Ifedayo'),
    ('Ifelodun'),
    ('Ila'),
    ('Ilesa-East'),
    ('Ilesa-West'),
    ('Irepodun'),
    ('Irewole'),
    ('Isokan'),
    ('Iwo'),
    ('Obokun'),
    ('Odo-Otin'),
    ('Ola Oluwa'),
    ('Olorunda'),
    ('Ori-Ade'),
    ('Orolu'),
    ('Osogbo')
) AS l(lga);

-- Insert LGAs for Oyo
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Oyo'
) s
CROSS JOIN (
  VALUES
    ('Afijio'),
    ('Akinyele'),
    ('Atiba'),
    ('Atisbo'),
    ('Egbeda'),
    ('Ibadan-North'),
    ('Ibadan-North-East'),
    ('Ibadan-North-West'),
    ('Ibadan-South-East'),
    ('Ibadan-South-West'),
    ('Ibarapa-Central'),
    ('Ibarapa-East'),
    ('Ibarapa-North'),
    ('Ido'),
    ('Irepo'),
    ('Iseyin'),
    ('Itseiwaju'),
    ('Iwajowa'),
    ('Kajola'),
    ('Lagelu'),
    ('Ogo-Oluwa'),
    ('Ogbomosho-North'),
    ('Ogbomosho-South'),
    ('Olorunsogo'),
    ('Oluyole'),
    ('Ona-Ara'),
    ('Orelope'),
    ('Ori-Ire'),
    ('Oyo-East'),
    ('Oyo-West'),
    ('Saki-East'),
    ('Saki-West'),
    ('Surulere')
) AS l(lga);

-- Insert LGAs for Plateau
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Plateau'
) s
CROSS JOIN (
  VALUES
    ('Barkin-Ladi'),
    ('Bassa'),
    ('Bokkos'),
    ('Jos-East'),
    ('Jos-North'),
    ('Jos-South'),
    ('Kanam'),
    ('Kanke'),
    ('Langtang-North'),
    ('Langtang-South'),
    ('Mangu'),
    ('Mikang'),
    ('Pankshin'),
    ('Quan''Anpan'),
    ('Riyom'),
    ('Shendam'),
    ('Wase')
) AS l(lga);

-- Insert LGAs for Rivers
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Rivers'
) s
CROSS JOIN (
  VALUES
    ('Aboa/Odual'),
    ('Ahoada-East'),
    ('Ahoada-West'),
    ('Akukutoru'),
    ('Andoni'),
    ('Asari-Toru'),
    ('Bonny'),
    ('Degema'),
    ('Eleme'),
    ('Emuoha'),
    ('Etche'),
    ('Gokana'),
    ('Ikwerre'),
    ('Khana'),
    ('Obia/Akpor'),
    ('Ogba-Egbema-Ndoni'),
    ('Ogba/Egbema/Ndoni'),
    ('Ogu/Bolo'),
    ('Okirika'),
    ('Omuma'),
    ('Opobo/Nkoro'),
    ('Oyigbo'),
    ('Port-Harcourt'),
    ('Tai')
) AS l(lga);

-- Insert LGAs for Sokoto
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Sokoto'
) s
CROSS JOIN (
  VALUES
    ('Binji'),
    ('Bodinga'),
    ('Dange-Shuni'),
    ('Gada'),
    ('Goronyo'),
    ('Gudu'),
    ('Gwadabawa'),
    ('Illela'),
    ('Isa'),
    ('Kebbe'),
    ('Kware'),
    ('Rabah'),
    ('Sabon-Birni'),
    ('Shagari'),
    ('Silame'),
    ('Sokoto-North'),
    ('Sokoto-South'),
    ('Tambuwal'),
    ('Tangaza'),
    ('Tureta'),
    ('Wamakko'),
    ('Wurno'),
    ('Yabo')
) AS l(lga);

-- Insert LGAs for Taraba
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Taraba'
) s
CROSS JOIN (
  VALUES
    ('Ardo-Kola'),
    ('Bali'),
    ('Donga'),
    ('Gashaka'),
    ('Gassol'),
    ('Ibi'),
    ('Jalingo'),
    ('Karim-Lamido'),
    ('Kurmi'),
    ('Lau'),
    ('Sardauna'),
    ('Takum'),
    ('Ussa'),
    ('Wukari'),
    ('Yorro'),
    ('Zing')
) AS l(lga);

-- Insert LGAs for Yobe
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Yobe'
) s
CROSS JOIN (
  VALUES
    ('Bade'),
    ('Bursari'),
    ('Damaturu'),
    ('Fika'),
    ('Fune'),
    ('Geidam'),
    ('Gujba'),
    ('Gulani'),
    ('Jakusko'),
    ('Karasuwa'),
    ('Machina'),
    ('Nangere'),
    ('Nguru'),
    ('Potiskum'),
    ('Tarmuwa'),
    ('Yunusari'),
    ('Yusufari')
) AS l(lga);

-- Insert LGAs for Zamfara
INSERT INTO nigerian_areas (state_id, name)
SELECT id, lga FROM (
  SELECT id FROM nigerian_states WHERE name = 'Zamfara'
) s
CROSS JOIN (
  VALUES
    ('Anka'),
    ('Bakura'),
    ('Birnin Magaji/Kiyaw'),
    ('Bukkuyum'),
    ('Bungudu'),
    ('Gummi'),
    ('Gusau'),
    ('Kaura-Namoda'),
    ('Maradun'),
    ('Maru'),
    ('Shinkafi'),
    ('Talata-Mafara'),
    ('Zurmi')
) AS l(lga);

