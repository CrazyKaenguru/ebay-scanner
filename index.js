const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

//search(["Gtx 1060","","used"],["Mo","Fr"],["06:00","13:00"])

async function search(searchfilters,endDayRange,endTimeRange,maxPrice)
{
    
 await scrapeEBayItems(generateUrl(searchfilters));
  await  filterItems(endDayRange,endTimeRange);
 
}

function generateUrl(searchfilters)
{
   
   var searchInput= searchfilters[0]
   var isauction=searchfilters[1]
   var condition
    //condition: new/used/refurbished
    if(searchfilters[2]=="used")
    {
        condition=3000;
    }
    var url= "https://www.ebay.de/sch/i.html?_nkw="+searchInput.replace(/ /g, '+')+"&rt=nc&LH_Auction=1&LH_ItemCondition="+condition
    console.log(url)
 return url
}

async function scrapeEBayItems(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const items = [];

    $('li.s-item').each((index, element) => {
      //  console.log(element)
      const title = $(element).find('.s-item__title').text();
      var price = $(element).find('span.s-item__price').text().trim().toString().slice(4);
      price=parseFloat(price.replace(",", "."))
      var shipping = $(element).find('span.s-item__shipping.s-item__logisticsCost').text().trim();
      shipping= parseFloat(shipping.replace(/[^0-9,.]/g, '').replace(',', '.'))
      const end = $(element).find('span.s-item__time-end').text(); 
       
      const itemUrl = $(element).find('a.s-item__link').attr('href');

      const endDay=end.replace(/[()]/g, '').split(/[,?]/)[0]
     var endTime=end.replace(/[()]/g, '').split(/[,?]/)[1]
     if(endTime!=undefined)
     {
       endTime=endTime.slice(1)
     }
     
      items.push({
        title,
        price,
        shipping,
        endDay,
        endTime,
        itemUrl
      });
    });

    const data = JSON.stringify(items, null, 2);
    fs.writeFileSync('items.json', data);

    console.log(`Scraped ${items.length} items from ${url}`);
  } catch (error) {
    console.error(error);
  }
}

async function filterItems(endDayRange,endTimeRange)
{

    //processing the parameters
    function getDaysBetween(endDayRange) {
        const startDay=endDayRange[0]
        const endDay=endDayRange[1]
        const daysOfWeek = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
        const startIndex = daysOfWeek.indexOf(startDay);
        const endIndex = daysOfWeek.indexOf(endDay);
      
        if (startIndex === -1 || endIndex === -1) {
          throw new Error("Invalid start or end day.");
        }
      
        const daysBetween = [];
        for (let i = startIndex; i !== endIndex; i = (i + 1) % daysOfWeek.length) {
          daysBetween.push(daysOfWeek[i]);
        }
        daysBetween.push(endDay);
      
        return daysBetween;
      }
      function isTimeBetween(checkTime) {
        const startTime=endTimeRange[0]
        const endTime=endTimeRange[1]
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const [checkHour, checkMinute] = checkTime.split(':').map(Number);
      
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        const checkTimeInMinutes = checkHour * 60 + checkMinute;
      
        return checkTimeInMinutes >= startTimeInMinutes && checkTimeInMinutes <= endTimeInMinutes;
      }
      
    const daysInRange= getDaysBetween(endDayRange)
    console.log(daysInRange)
    fs.readFile('items.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading the input file:', err);
          return;
        }
    
        try {
          const items = JSON.parse(data);
          
         

          const filteredItems=items.filter(item => daysInRange.includes(item.endDay)&&item.shipping <50&&isTimeBetween(item.endTime) )
          console.log(filterItems)
          // Save the filtered items to the output fil
          fs.writeFile('filtereditems.json', JSON.stringify(filteredItems, null, 2), 'utf8', (err) => {
            if (err) {
              console.error('Error saving the filtered items:', err);
            } else {
              console.log(`Filtered items saved to ${'filtereditems.json'}`);
            }
          });
        } catch (parseError) {
          console.error('Error parsing the input JSON:', parseError);
        }
      });
}

module.exports = search

