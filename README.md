# stealth-weather-scheduler 🥷🌦️

Google Apps Script (GAS) を使用して、OpenWeatherMap の予報を Google カレンダーに自動同期するツールです。

## 🌟 特徴

- **ステルス仕様**: 予定を「予定なし（透明）」として登録するため、ユーザーの空き時間を潰さず、スケジュール管理の邪魔をしません。
- **ピンポイント予報**: 3時間ごとの予報ブロックに基づき、雨や猛暑の時間帯にジャストでイベントを作成します。
- **自己修復機能**: 1時間ごとに最新の予報をチェックし、予報が外れた（晴れに変わった）場合はカレンダーから予定を自動削除します。
- **マルチアラート**: 雨だけでなく、熱中症（気温＆湿度のAND判定）、猛暑、低温、強風に対応。

## ⚙️ セットアップ

1. [OpenWeatherMap API](https://openweathermap.org/api) で API キーを取得します。
2. Google カレンダーで専用のマイカレンダーを作成し、「カレンダー ID」を控えます。
3. Google Apps Script エディタに `weather_sync.js` の内容を貼り付け、設定部分（APIキー、緯度・経度、カレンダーID）を書き換えます。
4. `checkAndManageWeatherEvents` 関数を「時間主導型トリガー（1時間おき）」に設定します。

## 🛠️ 技術スタック

- Google Apps Script
- OpenWeatherMap API (5 Day / 3 Hour Forecast)

----------------------English Version----------------------

# stealth-weather-scheduler 🥷🌦️
A Google Apps Script (GAS) tool that automatically synchronizes weather forecasts from OpenWeatherMap to your Google Calendar.

## 🌟 Key Features
- 🥷 Stealth Mode -
Events are registered as "Free (TRANSPARENT)", meaning they display as colored bands but do not block your empty time slots. 
It provides visual awareness without interfering with your actual schedule—designed with the spirit of a "Shinobi" supporting you from the shadows.

- 📍 Pinpoint Forecasting -
Unlike daily summaries, this tool creates event blocks specifically during the predicted timeframes 
(based on OpenWeatherMap's 3-hour forecast data). You’ll know exactly when the rain starts and ends.

- ⏳ 1-Hour Trigger & Self-Healing -
Optimized for GAS execution limits, the script runs every hour.
It automatically updates or removes events if the forecast changes (e.g., if a rain prediction turns into sun), 
keeping your calendar clean and accurate.

- ⚠️ Multi-Alerts - 
- **Rain** : Direct sync from weather codes.
- **Heatstroke** : Smart alert triggered only when BOTH temperature and humidity are high (Temp ≥ 30°C AND Humidity ≥ 70%).
- **Extreme Heat** : Alert for temperatures ≥ 35°C.
- **Chilly** : Alert for low temperatures.
- **Windy** : Alert for strong winds.

## ⚙️ Setup

1.API Key: Get your free API key from OpenWeatherMap.

2.Calendar ID: Create a dedicated "Weather" calendar in Google Calendar and copy its "Calendar ID".

3.Google Apps Script: Create a new GAS project.

4.Paste the code from weather_sync.js.

5.Update the configuration section with your API Key, LATITUDE/LONGITUDE, and Calendar ID.

6.Trigger: Set the checkAndManageWeatherEvents function to run on a "Time-driven trigger" (Every hour).

## 🛠️ Tech Stack
Google Apps Script (CalendarApp / UrlFetchApp)
OpenWeatherMap API (5 Day / 3 Hour Forecast)

⚠️ Disclaimer
This tool depends on the accuracy and availability of OpenWeatherMap data. Please use it as a general reference for your daily planning.
