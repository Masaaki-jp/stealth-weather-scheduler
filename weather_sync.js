/**
 * kage-weather-sync (仮)
 * * OpenWeatherMapの予報に基づき、Googleカレンダーに「予定なし（透明）」で天気を登録します。
 * ユーザーの予定枠を潰さず、必要な時だけカレンダーに気配を現す忍のような仕様です。
 */

// --- 設定部分 ---
const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // ここにAPIキーを入力
const LATITUDE = 35.586; // 取得したい場所の緯度
const LONGITUDE = 139.632; // 取得したい場所の経度
const CALENDAR_ID = 'YOUR_CALENDAR_ID@group.calendar.google.com'; // 登録先カレンダーID

// --- 気象条件の閾値設定 ---
const THRESHOLDS = {
  RAIN_CODES: [
    200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
    300, 301, 302, 310, 311, 312, 313, 314, 321,
    500, 501, 502, 503, 504, 511, 520, 521, 522, 531
  ],
  HEATSTROKE_ALERT_TEMP: 30,
  HEATSTROKE_ALERT_HUMIDITY: 70,
  EXTREME_HEAT_TEMP: 35,
  HYPOTHERMIA_TEMP: 5,
  STRONG_WIND_SPEED: 10
};

// --- イベントタイトルの設定 ---
const EVENT_TITLES = {
  RAIN: 'Rain',
  HEATSTROKE_ALERT: 'Heatstroke',
  EXTREME_HEAT: ' Extreme Heat（Stay Home）',
  HYPOTHERMIA: 'Chilly',
  STRONG_WIND: 'Windy'
};

// --- イベントの色の設定 ---
const EVENT_COLORS = {
  RAIN: '7',             // 青
  HEATSTROKE_ALERT: '6', // オレンジ
  EXTREME_HEAT: '3',     // 紫
  HYPOTHERMIA: '1',      // 薄紫
  STRONG_WIND: '2'       // 緑
};

// --- イベントの詳細説明 ---
const EVENT_DESCRIPTIONS = {
  RAIN: '傘を持って行きましょう。',
  HEATSTROKE_ALERT: '熱中症に警戒し、水分補給や休憩を心がけましょう。',
  EXTREME_HEAT: '気温35℃以上の猛暑が予想されます。外出は原則控えてください。',
  HYPOTHERMIA: '低体温症に注意し、防寒対策を万全にしましょう。',
  STRONG_WIND: '強風に注意し、屋外活動は控えめにしましょう。'
};

// --- 主要関数 ---
function checkAndManageWeatherEvents() {
  const weatherApi = new OpenWeatherMapAPI(OPENWEATHER_API_KEY, LATITUDE, LONGITUDE);
  const calendarManager = new GoogleCalendarManager(CALENDAR_ID);

  try {
    // 3時間ごとの予報ブロックを取得
    const forecastBlocks = weatherApi.getForecastBlocks();

    // 各ブロック（3時間単位）ごとにカレンダーを最新化
    for (const block of forecastBlocks) {
      calendarManager.manageEvent(block.startTime, block.endTime, EVENT_TITLES.RAIN, EVENT_DESCRIPTIONS.RAIN, EVENT_COLORS.RAIN, block.hazards.isRainy);
      calendarManager.manageEvent(block.startTime, block.endTime, EVENT_TITLES.HEATSTROKE_ALERT, EVENT_DESCRIPTIONS.HEATSTROKE_ALERT, EVENT_COLORS.HEATSTROKE_ALERT, block.hazards.isHeatstrokeAlert);
      calendarManager.manageEvent(block.startTime, block.endTime, EVENT_TITLES.EXTREME_HEAT, EVENT_DESCRIPTIONS.EXTREME_HEAT, EVENT_COLORS.EXTREME_HEAT, block.hazards.isExtremeHeat);
      calendarManager.manageEvent(block.startTime, block.endTime, EVENT_TITLES.HYPOTHERMIA, EVENT_DESCRIPTIONS.HYPOTHERMIA, EVENT_COLORS.HYPOTHERMIA, block.hazards.isCold);
      calendarManager.manageEvent(block.startTime, block.endTime, EVENT_TITLES.STRONG_WIND, EVENT_DESCRIPTIONS.STRONG_WIND, EVENT_COLORS.STRONG_WIND, block.hazards.isWindy);
    }

  } catch (e) {
    Logger.log('エラーが発生しました: ' + e.toString());
  }
}

// --- クラス定義 ---

/**
 * OpenWeatherMap APIとの通信を管理するクラス
 */
class OpenWeatherMapAPI {
  constructor(apiKey, latitude, longitude) {
    this.apiKey = apiKey;
    this.latitude = latitude;
    this.longitude = longitude;
    this.baseUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${this.latitude}&lon=${this.longitude}&appid=${this.apiKey}&units=metric&lang=ja`;
  }

  /**
   * 3時間ごとの予報ブロックを配列として返す
   */
  getForecastBlocks() {
    const response = UrlFetchApp.fetch(this.baseUrl);
    const json = JSON.parse(response.getContentText());

    if (!json || !json.list) {
      throw new Error('天気データが見つからないか、APIレスポンスの形式が不正です。');
    }

    const blocks = [];
    const now = new Date();

    for (const forecast of json.list) {
      const startTime = new Date(forecast.dt * 1000);
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // 3時間後

      // 過去の予報はスキップ
      if (endTime < now) continue;

      const hazards = {
        isRainy: false,
        isHeatstrokeAlert: false,
        isExtremeHeat: false,
        isCold: false,
        isWindy: false
      };

      if (THRESHOLDS.RAIN_CODES.includes(forecast.weather[0].id)) hazards.isRainy = true;
      if (forecast.main.temp >= THRESHOLDS.HEATSTROKE_ALERT_TEMP && forecast.main.humidity >= THRESHOLDS.HEATSTROKE_ALERT_HUMIDITY) hazards.isHeatstrokeAlert = true;
      if (forecast.main.temp >= THRESHOLDS.EXTREME_HEAT_TEMP) hazards.isExtremeHeat = true;
      if (forecast.main.temp <= THRESHOLDS.HYPOTHERMIA_TEMP) hazards.isCold = true;
      if (forecast.wind.speed >= THRESHOLDS.STRONG_WIND_SPEED) hazards.isWindy = true;

      blocks.push({ startTime, endTime, hazards });
    }
    return blocks;
  }
}

/**
 * Google Calendarのイベントを管理するクラス
 */
class GoogleCalendarManager {
  constructor(calendarId) {
    this.calendar = CalendarApp.getCalendarById(calendarId);
  }

  /**
   * 特定の時間のイベント作成・削除を管理し、予定枠を「予定なし」にする
   */
  manageEvent(startTime, endTime, eventTitle, eventDescription, eventColor, shouldExist) {
    // 指定された時間枠内のイベントを取得
    const existingEvents = this.calendar.getEvents(startTime, endTime);
    // その中からタイトルが一致するものだけを抽出
    const targetEvents = existingEvents.filter(e => e.getTitle() === eventTitle);

    if (shouldExist) {
      if (targetEvents.length === 0) {
        // イベントを作成
        const newEvent = this.calendar.createEvent(eventTitle, startTime, endTime, {
          description: eventDescription
        });
        newEvent.setColor(eventColor);
        
        // 【重要】ユーザーの予定をブロックしないよう「予定なし（透明）」に設定
        newEvent.setTransparency(CalendarApp.EventTransparency.TRANSPARENT);
        
        Logger.log(`✅ 作成: ${startTime.toLocaleString()} 〜 ${endTime.toLocaleTimeString()} に "${eventTitle}" を登録しました。`);
      }
    } else {
      if (targetEvents.length > 0) {
        // 予報が外れた（晴れに変わった）場合は既存のイベントを削除
        targetEvents.forEach(event => {
          event.deleteEvent();
          Logger.log(`🗑️ 削除: ${startTime.toLocaleString()} の "${eventTitle}" をカレンダーから消去しました。`);
        });
      }
    }
  }
}
