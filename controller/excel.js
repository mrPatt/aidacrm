var mysql = require('mysql');
var express = require('express');
var Query = require('node-mysql-ejq');
var config = require('../config/config');
var excel = require('node-excel-export');
var fs = require('fs');
var path = require('path');
var con = mysql.createConnection(config.db);

var query = new Query(con);

var router = express.Router();

router.post('/export', async function(req, res){
	var id = req.body.id;
	try{
		// You can define styles as json object
		const styles = {
		  headerDark: {
		    font: {
		      color: {
		        rgb: '000'
		      },
		      sz: 12
		    }
		  }
		};
		 
		//Array of objects representing heading rows (very top)
	
		 
		//Here you specify the export structure
		const specification = {
			filial: {
		    	displayName: 'Филиал',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			crmId: {
		    	displayName: 'ID в CRM',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			addDate: {
		    	displayName: 'Дата добавления в реестр',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			russian_post: {
		    	displayName: 'Российский поставщик',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			IIN: {
		    	displayName: 'ИНН',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			russBillNum: {
		    	displayName: '№ российского счета по РФ',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			oplataRuss: {
		    	displayName: 'Сумма оплаты по российскому счету (руб.)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			oplataRussNds: {
		    	displayName: 'Сумма российского счета с НДС',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			NDS: {
		    	displayName: 'НДС',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			summWithNad: {
		    	displayName: 'Сумма российского счета с надбавкой',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			otgruzka: {
		    	displayName: 'Срок отгрузки',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			cityFrom: {
		    	displayName: 'Город отправки',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			cityTo: {
		    	displayName: 'Город доставки груза',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			typeDostavka: {
		    	displayName: 'Доставка',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			kazBillNum: {
		    	displayName: '№ счета РК',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			percent: {
		    	displayName: 'Процент (%)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			rubKurs: {
		    	displayName: 'Курс на дату оплаты',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			manager: {
		    	displayName: 'Менеджер',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			prim: {
		    	displayName: 'Примечание',
		    	headerStyle: styles.headerDark,	
		    	width: 100 // <- width in pixels
			},
			vkl: {
		    	displayName: 'Вкл/Не вкл в счет доставки',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			billNoDelivery: {
		    	displayName: 'Счет в тг без доставки',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			deliverySumm: {
		    	displayName: 'Сумма за доставку',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			itogSummBillKaz: {
		    	displayName: 'Итоговая Сумма счета РК',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			dateOtgruz: {
		    	displayName: 'Дата отгрузки',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			deliverySchema: {
		    	displayName: 'Схема доставки',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			declarant: {
		    	displayName: 'Декларант (руб)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			tkDIP: {
		    	displayName: 'ТК (оплата ДИП-Сервисом)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			deliverySummDIP: {
		    	displayName: 'Сумма за доставку (оплата ДИП-Сервисом) руб',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			zaborStuff: {
		    	displayName: 'Забор груза (оплата Дип-Сервисом)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			omsk: {
		    	displayName: 'Движения курьера по Омску (руб)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			doverOrig: {
		    	displayName: 'Оригинал доверенности (руб)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			tkAzia: {
		    	displayName: 'ТК (оплата Азией)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			deliverySummAzia: {
		    	displayName: 'Сумма за доставку (оплата Азией) тг',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			cityDelivery: {
		    	displayName: 'Доставка по городу получения',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			deliveryProch: {
		    	displayName: 'Прочие расходы по доставке ',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			deliverySebes: {
		    	displayName: 'Итоговая себестоимость перевозки (тг)',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			convertKurs: {
		    	displayName: 'Курс конвертации',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			summClean: {
		    	displayName: 'Чистая сумма реализации по аутсорсу',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			kursRaznica: {
		    	displayName: 'Курс разница',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			deliverySummReal: {
		    	displayName: 'Сумма реализации по доставке',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			},
			itogSumm1C: {
		    	displayName: 'Итоговая сумма реализации по 1С',
		    	headerStyle: styles.headerDark,
		    	width: 100 // <- width in pixels
			}
		}

		 
		// The data set should have the following shape (Array of Objects)
		// The order of the keys is irrelevant, it is also irrelevant if the
		// dataset contains more fields as the report is build based on the
		// specification provided above. But you should have all the fields
		// that are listed in the report specification
		const dataset = [
			{
				filial: '',
				crmId: '',
				addDate: '',
				russian_post: '',
				IIN: '',
				russBillNum: '',
				oplataRuss: '',
				oplataRussNds: '',
				NDS: '',
				summWithNad: '',
				otgruzka: '',
				cityFrom: '',
				cityTo: '',
				typeDostavka: '',
				kazBillNum: '',
				percent: '',
				rubKurs: '',
				manager: '',
				prim: '',
				vkl: '',
				billNoDelivery: '',
				deliverySumm: '',
				itogSummBillKaz: '',
				dateOtgruz: '',
				deliverySchema: '',
				declarant: '',
				tkDIP: '',
				deliverySummDIP: '',
				zaborStuff: '',
				omsk: '',
				doverOrig: '',
				tkAzia: '',
				deliverySummAzia: '',
				cityDelivery: '',
				deliveryProch: '',
				deliverySebes: '',
				convertKurs: '',
				summClean:'' ,
				kursRaznica:  '',
				deliverySummReal: '',
				itogSumm1C: ''
			},
		]
		 
		// Define an array of merges. 1-1 = A:1
		// The merges are independent of the data.
		// A merge will overwrite all data _not_ in the top-left cell.
		for(var n = 1; n < 41; n++){
			const merges = [
			  { start: { row: 1, column: n }, end: { row: 1, column: n } }
			  // { start: { row: 1, column: 2 }, end: { row: 1, column: 2 } },
			  // { start: { row: 1, column: 3 }, end: { row: 1, column: 3 } },
			  // { start: { row: 1, column: 4 }, end: { row: 1, column: 4 } },
			  // { start: { row: 1, column: 5 }, end: { row: 1, column: 5 } },
			  // { start: { row: 1, column: 6 }, end: { row: 1, column: 6 } },
			  // { start: { row: 1, column: 7 }, end: { row: 1, column: 7 } },
			  // { start: { row: 1, column: 8 }, end: { row: 1, column: 8 } },
			  // { start: { row: 1, column: 9 }, end: { row: 1, column: 9 } },
			  // { start: { row: 1, column: 10}, end: { row: 1, column: 10} },
			  // { start: { row: 1, column: 11}, end: { row: 1, column: 11} },
			  // { start: { row: 1, column: 12}, end: { row: 1, column: 12} },
			  // { start: { row: 1, column: 13}, end: { row: 1, column: 13} },
			  // { start: { row: 1, column: 14}, end: { row: 1, column: 14} },
			  // { start: { row: 1, column: 15}, end: { row: 1, column: 15} },
			  // { start: { row: 1, column: 16}, end: { row: 1, column: 16} },
			  // { start: { row: 1, column: 17}, end: { row: 1, column: 17} },
			  // { start: { row: 1, column: 18}, end: { row: 1, column: 18} },
			  // { start: { row: 1, column: 19}, end: { row: 1, column: 19} },
			  // { start: { row: 1, column: 20}, end: { row: 1, column: 20} },
			  // { start: { row: 1, column: 21}, end: { row: 1, column: 21} },
			  // { start: { row: 1, column: 22}, end: { row: 1, column: 22} },
			  // { start: { row: 1, column: 23}, end: { row: 1, column: 23} },
			  // { start: { row: 1, column: 24}, end: { row: 1, column: 24} },
			  // { start: { row: 1, column: 25}, end: { row: 1, column: 25} },
			  // { start: { row: 2, column: 26}, end: { row: 2, column: 26} },
			  // { start: { row: 2, column: 27}, end: { row: 2, column: 27} },
			  // { start: { row: 1, column: 28}, end: { row: 1, column: 28} },
			  // { start: { row: 1, column: 29}, end: { row: 1, column: 29} },
			  // { start: { row: 1, column: 30}, end: { row: 1, column: 30} },
			  // { start: { row: 1, column: 31}, end: { row: 1, column: 31} },
			  // { start: { row: 1, column: 32}, end: { row: 1, column: 32} },
			  // { start: { row: 1, column: 33}, end: { row: 1, column: 33} },
			  // { start: { row: 1, column: 34}, end: { row: 1, column: 34} },
			  // { start: { row: 1, column: 35}, end: { row: 1, column: 35} },
			  // { start: { row: 1, column: 36}, end: { row: 1, column: 36} },
			  // { start: { row: 1, column: 37}, end: { row: 1, column: 37} },
			  // { start: { row: 1, column: 38}, end: { row: 1, column: 38} },
			  // { start: { row: 1, column: 39}, end: { row: 1, column: 39} },
			  // { start: { row: 1, column: 40}, end: { row: 1, column: 40} },
			  // { start: { row: 1, column: 41}, end: { row: 1, column: 41} },

			]
		}
		 
		// Create the excel report.
		// This function will return Buffer
		const report = excel.buildExport(
		  [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
		    {
		      name: 'Report', // <- Specify sheet name (optional)
		      //heading: heading, // <- Raw heading array (optional)
		      merges: merges, // <- Merge cell ranges
		      specification: specification, // <- Report specification
		      data: dataset // <-- Report data
		    }
		  ]
		);
		 
		// You can then return this straight
		var normalPath = path.normalize(__dirname + '/../attachments/');
		var name = `asdf${new Date().valueOf()}.xlsx`;
		console.log(normalPath)
		fs.writeFileSync(normalPath + name, report)
		console.log(report)
		return res.send(report);
		 
		// OR you can save this buffer to the disk by creating a file.
	}catch(e){
		console.log(e)
	}
	
})

module.exports = router;