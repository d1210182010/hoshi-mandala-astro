import json
import os
import math
from datetime import date, timedelta, datetime

# 嘗試匯入 Skyfield，若無則使用 Mock
try:
    from skyfield.api import load, Star
    from skyfield.data import hipparcos
    import numpy as np
    HAS_SKYFIELD = True
except ImportError:
    print("WARNING: skyfield/numpy not installed. Generating mock data.")
    HAS_SKYFIELD = False

OUTPUT_DIR = '../public/data'
START_YEAR = 1990
END_YEAR = 2099

def get_julian_date(year, month, day):
    # Simplified Julian Date for Mock
    return 2451545.0 + (datetime(year, month, day) - datetime(2000, 1, 1)).days

def generate_mock_ephemeris():
    """ 生成模擬行星軌道數據 (圓形軌道近似) """
    data = {
        "start": f"{START_YEAR}-01-01",
        "end": f"{END_YEAR}-12-31",
        "bodies": {}
    }
    
    # 簡易軌道參數 (AU, Period days)
    planets = {
        'mercury': (0.39, 88),
        'venus': (0.72, 225),
        'earth': (1.0, 365.25),
        'mars': (1.52, 687),
        'jupiter': (5.2, 4333),
        'saturn': (9.58, 10759),
        'rahu': (1.0, 6793), # Node, approximate
        'ketu': (1.0, 6793)  # Node, approximate
    }

    start_date = date(START_YEAR, 1, 1)
    end_date = date(END_YEAR, 12, 31)
    days_count = (end_date - start_date).days + 1

    # 生成每 10 天一筆數據以節省空間 (前端插值)
    step = 5 
    
    for name, (r, period) in planets.items():
        positions = []
        for i in range(0, days_count, step):
            d = start_date + timedelta(days=i)
            # 簡單角度計算
            angle = (i / period) * 2 * math.pi
            x = r * math.cos(angle)
            y = 0 # 簡化為平面
            z = r * math.sin(angle)
            
            # 格式：[x, y, z] 精簡小數點
            positions.append([round(x, 3), round(y, 3), round(z, 3)])
            
        data['bodies'][name] = positions

    data['step'] = step
    return data

def generate_real_ephemeris():
    """ 使用 Skyfield 生成真實數據 """
    if not HAS_SKYFIELD: return generate_mock_ephemeris()
    
    ts = load.timescale()
    eph = load('de421.bsp') # 需要下載 de421.bsp (16MB)
    
    bodies = {
        'mercury': eph['mercury'],
        'venus': eph['venus'],
        'earth': eph['earth'],
        'mars': eph['mars'],
        'jupiter': eph['jupiter barycenter'],
        'saturn': eph['saturn barycenter'],
        # Rahu/Ketu are abstract points, skipped or approximated
    }
    
    data = {
        "start": f"{START_YEAR}-01-01",
        "end": f"{END_YEAR}-12-31",
        "bodies": {},
        "step": 5
    }

    start_date = date(START_YEAR, 1, 1)
    end_date = date(END_YEAR, 12, 31)
    days_count = (end_date - start_date).days + 1
    
    times = []
    # Build time array
    for i in range(0, days_count, data['step']):
        d = start_date + timedelta(days=i)
        times.append(ts.utc(d.year, d.month, d.day))

    for name, body in bodies.items():
        # Heliocentric positions (relative to Sun)
        astrometric = eph['sun'].at(times).observe(body)
        x, y, z = astrometric.position.au
        
        # Transpose and round
        pos_list = []
        for i in range(len(x)):
            pos_list.append([round(x[i], 4), round(y[i], 4), round(z[i], 4)])
        
        data['bodies'][name] = pos_list
        print(f"Generated {name}: {len(pos_list)} frames")

    return data

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    print(f"Generating Ephemeris for {START_YEAR}-{END_YEAR}...")
    
    # 1. Ephemeris (Planets)
    # 如果有 Skyfield 且有 de421.bsp 則跑真實數據，否則跑 Mock
    # 這裡為了演示方便，預設跑 Mock (因為環境通常沒有 de421)
    # 若要真實數據：請下載 de421.bsp 到 scripts/ 並確保安裝 skyfield
    ephem_data = generate_mock_ephemeris() 
    
    with open(os.path.join(OUTPUT_DIR, 'ephemeris.json'), 'w') as f:
        json.dump(ephem_data, f)
    print("Saved ephemeris.json")

    # 2. Stars (Static)
    # 這裡放一些真實恆星的日心座標 (J2000, AU)
    # 北斗七星 + 二十八宿代表星 (Yogatara)
    # 這裡僅列出部分作為範例，真實專案應完整列出
    stars_data = {
        "big_dipper": [
            {"id": "bd_1", "name": "Dubhe", "pos": [30.1, 50.2, 10.5]}, # Mock coords
            {"id": "bd_2", "name": "Merak", "pos": [32.1, 48.2, 11.5]},
            # ... 其他
        ],
        "zodiac": [
            # Aries (Hamal), etc.
        ],
        "lunar_mansion": [
            # Spica (Chitra), etc.
        ]
    }
    
    # 由於恆星太遠，其實我們只要它的 RA/Dec 方向即可
    # 為了 3D 效果，我們將其投射在一個大球體上 (R=100 AU)
    
    with open(os.path.join(OUTPUT_DIR, 'stars_static.json'), 'w') as f:
        json.dump(stars_data, f)
    print("Saved stars_static.json")

if __name__ == "__main__":
    main()
