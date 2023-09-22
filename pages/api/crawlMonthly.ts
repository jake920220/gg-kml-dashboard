import {NextApiRequest, NextApiResponse} from "next";

import axios from "axios";
import * as cheerio from 'cheerio';
import moment from "moment";

const RETURN_POINT = 0;
const OKA_POINT = 0;
const UMA_POINT = [10, 5, -5, -10];
const MATCH_LENGTH: { [key: string]: number } = {
    '동장': 1,
    '남장': 2,
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const url = 'https://kml.or.kr/stat98/record_list.php?year=2023&month=9';
    // 추출할 특정 날짜
    const targetDate = '2023-09-21'; // 원하는 날짜로 변경

    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        // 특정 테이블을 선택 (여기서는 첫 번째 테이블을 선택)
        const table = $('table')[0];

        // 테이블의 tbody 선택
        const tbody = $(table).find('tbody');

        // tbody 내의 각 행 (tr)을 선택
        const rows = tbody.find('tr');

        const EntireData: { [key: string]: any }[] = [];

        // 각 행을 순회하면서 데이터를 읽어옴
        rows.each((index, element) => {
            const columns = $(element).find('td'); // 각 행의 열 (td) 선택
            const obj: any = {};

            // 각 열의 데이터를 rowData 배열에 추가
            columns.each((colIndex, colElement) => {
                const text = $(colElement).text().trim();
                let isDate = false;

                if (colIndex === 0) {
                    obj['id'] = text;
                } else if (colIndex === 1) {
                    obj['date'] = text;
                    const date = moment(obj['date'], 'YYYY-MM-DD');
                    // targetDate와 동일한 경우에만 해당 데이터를 처리
                    if (date.format('YYYY-MM-DD') === targetDate) {
                        isDate = true;
                    }
                } else if (colIndex === 2) {
                    obj['type'] = text;
                } else if (colIndex === 3) {
                    obj['first'] = text;
                } else if (colIndex === 4) {
                    obj['second'] = text;
                } else if (colIndex === 5) {
                    obj['third'] = text;
                } else if (colIndex === 6) {
                    obj['last'] = text;
                }

                if(isDate) {
                    EntireData.push(obj);
                }
            });
        });
        const array = getDailyPoint(EntireData);

        res.status(200).json({data: array});
    } catch (e) {
        console.log("e", e);
        res.status(500).json({ error: 'An error occurred' });
    }
}

const getDailyPoint = (dailyData:{ [key: string]: any }[]) => {
    const dailyPlayers: { [key: string]: number } = {};

    dailyData.forEach((data) => {
        const { first, second, third, last, type } = data;

        setNamesAndPoints(dailyPlayers, first, 0, type);
        setNamesAndPoints(dailyPlayers, second, 1, type);
        setNamesAndPoints(dailyPlayers, third, 2, type);
        setNamesAndPoints(dailyPlayers, last, 3, type);
    });

    for (const key in dailyPlayers) {
        if (Object.hasOwnProperty.call(dailyPlayers, key)) {
            dailyPlayers[key] = formatNumber(dailyPlayers[key]);
        }
    }

    const dataArray = Object.entries(dailyPlayers).map(([name, value]) => ({ name, value }));
    dataArray.sort((a:{name:string, value:number}, b:{name:string, value:number}) => b.value - a.value);
    return dataArray;
}

const setNamesAndPoints = (obj:any, data:string, rank:number, type:string) => {
    let splitData = data.split(":");
    let point = parseInt(splitData[1].trim());
    let name = splitData[0].split(']')[1];
    let winPoint = (point - RETURN_POINT + OKA_POINT) / 1000 + (UMA_POINT[rank] * MATCH_LENGTH[type]);
    obj[name] = obj[name] ? obj[name] + winPoint : winPoint;
}

const formatNumber = (num:number) => {
    // return num >= 0 ? Math.round(num * 10) / 10 : Math.floor(num * 10) / 10;
    if(num >= 0) {
        return Number(num.toFixed(1));
    } else {
        const numberString = num.toString();

        // 소수점을 기준으로 문자열을 분할
        const parts = numberString.split('.');

        if (parts.length === 2) {
            // 소수점 이하 자릿수가 1자리 이상이면 첫 번째 자릿수까지 자름
            parts[1] = parts[1].substring(0, 1);
        }

        // 다시 문자열로 합치고 반환
        return Number(parts.join('.'));
    }
}
