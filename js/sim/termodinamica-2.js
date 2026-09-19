/* Termodinâmica II — tabelas do Çengel (6ª ed.), modelos e simuladores */
var R134A_SAT = [[-40.0,51.25,0.0007054,0.36081,0.0,225.86,0.0,0.96866],[-38.0,56.86,0.0007083,0.32732,2.515,227.12,0.01072,0.96584],[-36.95,60.0,0.0007098,0.31121,3.841,227.79,0.01634,0.96441],[-36.0,62.95,0.0007112,0.29751,5.037,228.39,0.02138,0.96315],[-34.0,69.56,0.0007142,0.2709,7.566,229.65,0.03199,0.96058],[-33.87,70.0,0.0007144,0.26929,7.73,229.73,0.03267,0.96042],[-32.0,76.71,0.0007172,0.24711,10.1,230.91,0.04253,0.95813],[-31.13,80.0,0.0007185,0.23753,11.21,231.46,0.04711,0.9571],[-30.0,84.43,0.0007203,0.2258,12.65,232.17,0.05301,0.95579],[-28.65,90.0,0.0007223,0.21263,14.37,233.02,0.06008,0.95427],[-28.0,92.76,0.0007234,0.20666,15.2,233.43,0.06344,0.95356],[-26.37,100.0,0.0007259,0.19254,17.28,234.44,0.07188,0.95183],[-26.0,101.73,0.0007265,0.18946,17.76,234.68,0.07382,0.95144],[-24.0,111.37,0.0007297,0.17395,20.33,235.92,0.08414,0.94941],[-22.32,120.0,0.0007324,0.16212,22.49,236.97,0.09275,0.94779],[-22.0,121.72,0.0007329,0.15995,22.91,237.17,0.09441,0.94748],[-20.0,132.82,0.0007362,0.14729,25.49,238.41,0.10463,0.94564],[-18.77,140.0,0.0007383,0.14014,27.08,239.16,0.11087,0.94456],[-18.0,144.69,0.0007396,0.13583,28.09,239.64,0.11481,0.94389],[-16.0,157.38,0.000743,0.12542,30.69,240.87,0.12493,0.94222],[-15.6,160.0,0.0007437,0.12348,31.21,241.11,0.12693,0.9419],[-14.0,170.93,0.0007464,0.11597,33.3,242.09,0.13501,0.94063],[-12.73,180.0,0.0007487,0.11041,34.97,242.86,0.14139,0.93965],[-12.0,185.37,0.0007499,0.10736,35.92,243.3,0.14504,0.93911],[-10.09,200.0,0.0007533,0.099867,38.43,244.46,0.15457,0.93773],[-10.0,200.74,0.0007535,0.099516,38.55,244.51,0.15504,0.93766],[-8.0,217.08,0.0007571,0.092352,41.19,245.72,0.16498,0.93629],[-6.0,234.44,0.0007608,0.085802,43.84,246.91,0.17489,0.93497],[-5.38,240.0,0.000762,0.083897,44.66,247.28,0.17794,0.93458],[-4.0,252.85,0.0007646,0.079804,46.5,248.1,0.18476,0.93372],[-2.0,272.36,0.0007684,0.074304,49.17,249.28,0.19459,0.93253],[-1.25,280.0,0.0007699,0.072352,50.18,249.72,0.19829,0.9321],[0.0,293.01,0.0007723,0.069255,51.86,250.45,0.20439,0.93139],[2.0,314.84,0.0007763,0.064612,54.55,251.61,0.21415,0.93031],[2.46,320.0,0.0007772,0.063604,55.16,251.88,0.21637,0.93006],[4.0,337.9,0.0007804,0.060338,57.25,252.77,0.22387,0.92927],[5.82,360.0,0.0007841,0.056738,59.72,253.81,0.2327,0.92836],[6.0,362.23,0.0007845,0.056398,59.97,253.91,0.23356,0.92828],[8.0,387.88,0.0007887,0.052762,62.69,255.04,0.24323,0.92733],[8.91,400.0,0.0007907,0.051201,63.94,255.55,0.24761,0.92691],[10.0,414.89,0.000793,0.049403,65.43,256.16,0.25286,0.92641],[12.0,443.31,0.0007975,0.046295,68.18,257.27,0.26246,0.92554],[12.46,450.0,0.0007985,0.045619,68.81,257.53,0.26465,0.92535],[14.0,473.19,0.000802,0.043417,70.95,258.37,0.27204,0.9247],[15.71,500.0,0.0008059,0.041118,73.33,259.3,0.28023,0.924],[16.0,504.58,0.0008066,0.040748,73.73,259.46,0.28159,0.92389],[18.0,537.52,0.0008113,0.038271,76.52,260.53,0.29112,0.9231],[18.73,550.0,0.000813,0.037408,77.54,260.92,0.29461,0.92282],[20.0,572.07,0.0008161,0.035969,79.32,261.59,0.30063,0.92234],[21.55,600.0,0.0008199,0.034295,81.51,262.4,0.30799,0.92177],[22.0,608.27,0.000821,0.033828,82.14,262.64,0.31011,0.9216],[24.0,646.18,0.0008261,0.031834,84.98,263.67,0.31958,0.92088],[24.2,650.0,0.0008266,0.031646,85.26,263.77,0.32051,0.92081],[26.0,685.84,0.0008313,0.029976,87.83,264.68,0.32903,0.92018],[26.69,700.0,0.0008331,0.029361,88.82,265.03,0.3323,0.91994],[28.0,727.31,0.0008366,0.028242,90.69,265.68,0.33846,0.91948],[29.06,750.0,0.0008395,0.027371,92.22,266.2,0.34345,0.91912],[30.0,770.64,0.0008421,0.026622,93.58,266.66,0.34789,0.91879],[31.31,800.0,0.0008458,0.025621,95.47,267.29,0.35404,0.91835],[32.0,815.89,0.0008478,0.025108,96.48,267.62,0.3573,0.91811],[33.45,850.0,0.000852,0.024069,98.6,268.31,0.36413,0.91762],[34.0,863.11,0.0008536,0.023691,99.4,268.57,0.3667,0.91743],[35.51,900.0,0.000858,0.022683,101.61,269.26,0.37377,0.91692],[36.0,912.35,0.0008595,0.022364,102.33,269.49,0.37609,0.91675],[37.48,950.0,0.0008641,0.021438,104.51,270.15,0.38301,0.91624],[38.0,963.68,0.0008657,0.021119,105.29,270.39,0.38548,0.91606],[39.37,1000.0,0.00087,0.020313,107.32,270.99,0.39189,0.91558],[40.0,1017.1,0.000872,0.019952,108.26,271.27,0.39486,0.91536],[42.0,1072.8,0.0008786,0.018855,111.26,272.12,0.40425,0.91464],[44.0,1130.7,0.0008854,0.017824,114.28,272.95,0.41363,0.91391],[46.0,1191.0,0.0008924,0.016853,117.32,273.75,0.42302,0.91315],[46.29,1200.0,0.0008934,0.016715,117.77,273.87,0.42441,0.91303],[48.0,1253.6,0.0008996,0.015939,120.39,274.53,0.43242,0.91236],[52.0,1386.2,0.000915,0.014265,126.59,275.98,0.45126,0.91067],[52.4,1400.0,0.0009166,0.014107,127.22,276.12,0.45315,0.9105],[56.0,1529.1,0.0009317,0.012771,132.91,277.3,0.47018,0.9088],[57.88,1600.0,0.00094,0.012123,135.93,277.86,0.47911,0.90784],[60.0,1682.8,0.0009498,0.011434,139.36,278.46,0.4892,0.90669],[62.87,1800.0,0.0009639,0.010559,144.07,279.17,0.50294,0.90498],[65.0,1891.0,0.000975,0.00995,147.62,279.64,0.5132,0.90359],[67.45,2000.0,0.0009886,0.009288,151.76,280.09,0.52509,0.90184],[70.0,2118.2,0.0010037,0.008642,156.13,280.46,0.53755,0.89982],[75.0,2365.8,0.0010372,0.00748,164.98,280.82,0.56241,0.89512],[77.54,2500.0,0.0010566,0.006936,169.63,280.79,0.57531,0.89226],[80.0,2635.3,0.0010772,0.006436,174.24,280.59,0.588,0.88912],[85.0,2928.2,0.001127,0.005486,184.07,279.51,0.61473,0.88117],[86.16,3000.0,0.0011406,0.005275,186.46,279.09,0.62118,0.87894],[90.0,3246.9,0.0011932,0.004599,194.76,277.11,0.64336,0.8701],[95.0,3594.1,0.0012933,0.003726,207.05,272.26,0.67578,0.85289],[100.0,3975.1,0.0015269,0.00263,224.79,258.37,0.72217,0.81215]];
var R134A_SUP = {"0.06":[["sat",0.31121,227.79,0.9644],[-20.0,0.33608,240.76,1.0174],[-10.0,0.35048,248.58,1.0477],[0.0,0.36476,256.54,1.0774],[10.0,0.37893,264.66,1.1066],[20.0,0.39302,272.94,1.1353],[30.0,0.40705,281.37,1.1636],[40.0,0.42102,289.97,1.1915],[50.0,0.43495,298.74,1.2191],[60.0,0.44883,307.66,1.2463],[70.0,0.46269,316.75,1.2732],[80.0,0.47651,326.0,1.2997],[90.0,0.49032,335.42,1.326],[100.0,0.5041,344.99,1.352]],"0.1":[["sat",0.19254,234.44,0.9518],[-20.0,0.19841,239.5,0.9721],[-10.0,0.20743,247.49,1.003],[0.0,0.2163,255.58,1.0332],[10.0,0.22506,263.81,1.0628],[20.0,0.23373,272.17,1.0918],[30.0,0.24233,280.68,1.1203],[40.0,0.25088,289.34,1.1484],[50.0,0.25937,298.16,1.1762],[60.0,0.26783,307.13,1.2035],[70.0,0.27626,316.26,1.2305],[80.0,0.28465,325.55,1.2572],[90.0,0.29303,334.99,1.2836],[100.0,0.30138,344.6,1.3096]],"0.14":[["sat",0.14014,239.16,0.9446],[-10.0,0.14605,246.36,0.9724],[0.0,0.15263,254.6,1.0031],[10.0,0.15908,262.93,1.0331],[20.0,0.16544,271.38,1.0624],[30.0,0.17172,279.97,1.0912],[40.0,0.17794,288.7,1.1195],[50.0,0.18412,297.57,1.1474],[60.0,0.19025,306.59,1.1749],[70.0,0.19635,315.77,1.202],[80.0,0.20242,325.09,1.2288],[90.0,0.20847,334.57,1.2553],[100.0,0.21449,344.2,1.2814]],"0.18":[["sat",0.11041,242.86,0.9397],[-10.0,0.11189,245.16,0.9484],[0.0,0.11722,253.58,0.9798],[10.0,0.1224,262.04,1.0102],[20.0,0.12748,270.59,1.0399],[30.0,0.13248,279.25,1.069],[40.0,0.13741,288.05,1.0975],[50.0,0.1423,296.98,1.1256],[60.0,0.14715,306.05,1.1532],[70.0,0.15196,315.27,1.1805],[80.0,0.15673,324.63,1.2074],[90.0,0.16149,334.14,1.2339],[100.0,0.16622,343.8,1.2602]],"0.2":[["sat",0.09987,244.46,0.9377],[-10.0,0.09991,244.54,0.938],[0.0,0.10481,253.05,0.9698],[10.0,0.10955,261.58,1.0004],[20.0,0.11418,270.18,1.0303],[30.0,0.11874,278.89,1.0595],[40.0,0.12322,287.72,1.0882],[50.0,0.12766,296.68,1.1163],[60.0,0.13206,305.78,1.1441],[70.0,0.13641,315.01,1.1714],[80.0,0.14074,324.4,1.1983],[90.0,0.14504,333.93,1.2249],[100.0,0.14933,343.6,1.2512]],"0.24":[["sat",0.0839,247.28,0.9346],[0.0,0.08617,251.97,0.9519],[10.0,0.09026,260.65,0.9831],[20.0,0.09423,269.36,1.0134],[30.0,0.09812,278.16,1.0429],[40.0,0.10193,287.06,1.0718],[50.0,0.1057,296.08,1.1001],[60.0,0.10942,305.23,1.128],[70.0,0.1131,314.51,1.1554],[80.0,0.11675,323.93,1.1825],[90.0,0.12038,333.49,1.2092],[100.0,0.12398,343.2,1.2356]],"0.28":[["sat",0.07235,249.72,0.9321],[0.0,0.07282,250.83,0.9362],[10.0,0.07646,259.68,0.968],[20.0,0.07997,268.52,0.9987],[30.0,0.08338,277.41,1.0285],[40.0,0.08672,286.38,1.0576],[50.0,0.09,295.47,1.0862],[60.0,0.09324,304.67,1.1142],[70.0,0.09644,314.0,1.1418],[80.0,0.09961,323.46,1.169],[90.0,0.10275,333.06,1.1958],[100.0,0.10587,342.8,1.2222],[110.0,0.10897,352.68,1.2483],[120.0,0.11205,362.7,1.2742],[130.0,0.11512,372.87,1.2997],[140.0,0.11818,383.18,1.325]],"0.32":[["sat",0.0636,251.88,0.9301],[10.0,0.06609,258.69,0.9544],[20.0,0.06925,267.66,0.9856],[30.0,0.07231,276.65,1.0157],[40.0,0.0753,285.7,1.0451],[50.0,0.07823,294.85,1.0739],[60.0,0.08111,304.11,1.1021],[70.0,0.08395,313.48,1.1298],[80.0,0.08675,322.98,1.1571],[90.0,0.08953,332.62,1.184],[100.0,0.09229,342.39,1.2105],[110.0,0.09503,352.3,1.2367],[120.0,0.09775,362.35,1.2626],[130.0,0.10045,372.54,1.2882],[140.0,0.10314,382.87,1.3135]],"0.4":[["sat",0.051201,255.55,0.9269],[10.0,0.051506,256.58,0.9305],[20.0,0.054213,265.86,0.9628],[30.0,0.056796,275.07,0.9937],[40.0,0.059292,284.3,1.0236],[50.0,0.061724,293.59,1.0528],[60.0,0.064104,302.96,1.0814],[70.0,0.066443,312.44,1.1094],[80.0,0.068747,322.02,1.1369],[90.0,0.071023,331.73,1.164],[100.0,0.073274,341.57,1.1907],[110.0,0.075504,351.53,1.2171],[120.0,0.077717,361.63,1.2431],[130.0,0.079913,371.87,1.2688],[140.0,0.082096,382.24,1.2942]],"0.5":[["sat",0.041118,259.3,0.924],[20.0,0.042115,263.46,0.9383],[30.0,0.044338,273.01,0.9703],[40.0,0.046456,282.48,1.0011],[50.0,0.048499,291.96,1.0309],[60.0,0.050485,301.5,1.0599],[70.0,0.052427,311.1,1.0883],[80.0,0.054331,320.8,1.1162],[90.0,0.056205,330.61,1.1436],[100.0,0.058053,340.53,1.1705],[110.0,0.05988,350.57,1.1971],[120.0,0.061687,360.73,1.2233],[130.0,0.063479,371.03,1.2491],[140.0,0.065256,381.46,1.2747],[150.0,0.067021,392.02,1.2999],[160.0,0.068775,402.72,1.3249]],"0.6":[["sat",0.034295,262.4,0.9218],[30.0,0.035984,270.81,0.9499],[40.0,0.037865,280.58,0.9816],[50.0,0.039659,290.28,1.0121],[60.0,0.041389,299.98,1.0417],[70.0,0.043069,309.73,1.0705],[80.0,0.04471,319.55,1.0987],[90.0,0.046318,329.46,1.1264],[100.0,0.0479,339.47,1.1536],[110.0,0.049458,349.59,1.1803],[120.0,0.050997,359.82,1.2067],[130.0,0.052519,370.18,1.2327],[140.0,0.054027,380.66,1.2584],[150.0,0.055522,391.27,1.2838],[160.0,0.057006,402.01,1.3088]],"0.7":[["sat",0.029361,265.03,0.9199],[30.0,0.029966,268.45,0.9313],[40.0,0.031696,278.57,0.9641],[50.0,0.033322,288.53,0.9954],[60.0,0.034875,298.42,1.0256],[70.0,0.036373,308.33,1.0549],[80.0,0.037829,318.28,1.0835],[90.0,0.03925,328.29,1.1114],[100.0,0.040642,338.4,1.1389],[110.0,0.04201,348.6,1.1658],[120.0,0.043358,358.9,1.1924],[130.0,0.044688,369.32,1.2186],[140.0,0.046004,379.86,1.2444],[150.0,0.047306,390.52,1.2699],[160.0,0.048597,401.31,1.2951]],"0.8":[["sat",0.025621,267.29,0.9183],[40.0,0.027035,276.45,0.948],[50.0,0.028547,286.69,0.9802],[60.0,0.029973,296.81,1.011],[70.0,0.03134,306.88,1.0408],[80.0,0.032659,316.97,1.0698],[90.0,0.033941,327.1,1.0981],[100.0,0.035193,337.3,1.1258],[110.0,0.03642,347.59,1.153],[120.0,0.037625,357.97,1.1798],[130.0,0.038813,368.45,1.2061],[140.0,0.039985,379.05,1.2321],[150.0,0.041143,389.76,1.2577],[160.0,0.04229,400.59,1.283],[170.0,0.043427,411.55,1.308],[180.0,0.044554,422.64,1.3327]],"0.9":[["sat",0.022683,269.26,0.9169],[40.0,0.023375,274.17,0.9327],[50.0,0.024809,284.77,0.966],[60.0,0.026146,295.13,0.9976],[70.0,0.027413,305.39,1.028],[80.0,0.02863,315.63,1.0574],[90.0,0.029806,325.89,1.086],[100.0,0.030951,336.19,1.114],[110.0,0.032068,346.56,1.1414],[120.0,0.033164,357.02,1.1684],[130.0,0.034241,367.58,1.1949],[140.0,0.035302,378.23,1.221],[150.0,0.036349,389.0,1.2467],[160.0,0.037384,399.88,1.2721],[170.0,0.038408,410.88,1.2972],[180.0,0.039423,422.0,1.3221]],"1.0":[["sat",0.020313,270.99,0.9156],[40.0,0.020406,271.71,0.9179],[50.0,0.021796,282.74,0.9525],[60.0,0.023068,293.38,0.985],[70.0,0.024261,303.85,1.016],[80.0,0.025398,314.25,1.0458],[90.0,0.026492,324.64,1.0748],[100.0,0.027552,335.06,1.1031],[110.0,0.028584,345.53,1.1308],[120.0,0.029592,356.06,1.158],[130.0,0.030581,366.69,1.1846],[140.0,0.031554,377.4,1.2109],[150.0,0.032512,388.22,1.2368],[160.0,0.033457,399.15,1.2623],[170.0,0.034392,410.2,1.2875],[180.0,0.035317,421.36,1.3124]],"1.2":[["sat",0.016715,273.87,0.913],[50.0,0.017201,278.27,0.9267],[60.0,0.018404,289.64,0.9614],[70.0,0.019502,300.61,0.9938],[80.0,0.020529,311.39,1.0248],[90.0,0.021506,322.07,1.0546],[100.0,0.022442,332.73,1.0836],[110.0,0.023348,343.4,1.1118],[120.0,0.024228,354.11,1.1394],[130.0,0.025086,364.88,1.1664],[140.0,0.025927,375.72,1.193],[150.0,0.026753,386.66,1.2192],[160.0,0.027566,397.69,1.2449],[170.0,0.028367,408.82,1.2703],[180.0,0.029158,420.07,1.2954]],"1.4":[["sat",0.014107,276.12,0.9105],[60.0,0.015005,285.47,0.9389],[70.0,0.01606,297.1,0.9733],[80.0,0.017023,308.34,1.0056],[90.0,0.017923,319.37,1.0364],[100.0,0.018778,330.3,1.0661],[110.0,0.019597,341.19,1.0949],[120.0,0.020388,352.09,1.123],[130.0,0.021155,363.02,1.1504],[140.0,0.021904,374.01,1.1773],[150.0,0.022636,385.07,1.2038],[160.0,0.023355,396.2,1.2298],[170.0,0.024061,407.43,1.2554],[180.0,0.024757,418.76,1.2807]],"1.6":[["sat",0.012123,277.86,0.9078],[60.0,0.012372,280.69,0.9163],[70.0,0.01343,293.25,0.9535],[80.0,0.014362,305.07,0.9875],[90.0,0.015215,316.52,1.0194],[100.0,0.016014,327.76,1.05],[110.0,0.016773,338.91,1.0795],[120.0,0.0175,350.02,1.1081],[130.0,0.018201,361.12,1.136],[140.0,0.018882,372.26,1.1632],[150.0,0.019545,383.44,1.19],[160.0,0.020194,394.69,1.2163],[170.0,0.02083,406.02,1.2421],[180.0,0.021456,417.44,1.2676]]};
var AGUA_PSAT = [[0.01,0.6117],[5.0,0.8725],[10.0,1.2281],[15.0,1.7057],[20.0,2.3392],[25.0,3.1698],[30.0,4.2469],[35.0,5.6291],[40.0,7.3851],[45.0,9.5953],[50.0,12.352],[55.0,15.763],[60.0,19.947],[65.0,25.043],[70.0,31.202],[75.0,38.597],[80.0,47.416],[85.0,57.868],[90.0,70.183],[95.0,84.609],[100.0,101.42],[105.0,120.9],[110.0,143.38],[115.0,169.18],[120.0,198.67],[125.0,232.23],[130.0,270.28],[135.0,313.22],[140.0,361.53],[145.0,415.68],[150.0,476.16],[155.0,543.49],[160.0,618.23],[165.0,700.93],[170.0,792.18],[175.0,892.6],[180.0,1002.8],[185.0,1123.5],[190.0,1255.2],[195.0,1398.8],[200.0,1554.9],[205.0,1724.3],[210.0,1907.7],[215.0,2105.9],[220.0,2319.6],[225.0,2549.7],[230.0,2797.1],[235.0,3062.6],[240.0,3347.0],[245.0,3651.2],[250.0,3976.2],[255.0,4322.9],[260.0,4692.3],[265.0,5085.3],[270.0,5503.0],[275.0,5946.4],[280.0,6416.6],[285.0,6914.6],[290.0,7441.8],[295.0,7999.0],[300.0,8587.9],[305.0,9209.4],[310.0,9865.0]];

/* ==========================================================================
   Termodinâmica II — modelos (sem DOM, validados em node)
   --------------------------------------------------------------------------
     · R-134a      interpolação linear nas tabelas A-11, A-12 e A-13 do
                   Property Tables Booklet (Çengel, 6ª ed.) — exatamente como
                   se faz à mão nas listas de exercício
     · Ar úmido    ω = 0,622 Pv/(P − Pv),  h = 1,005 T + ω (2501,3 + 1,82 T),
                   Psat da água pela tabela A-4, bulbo úmido pela saturação
                   adiabática
     · Compressível relações isentrópicas e de choque normal de gás ideal
     · Refrigeração a ar  ciclo Brayton reverso com cp constante
   ========================================================================== */
(function (global) {
  'use strict';
  var TD2 = {};

  function interp(x, x0, x1, y0, y1) { return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  /* índice i tal que tab[i][col] <= x <= tab[i+1][col] (tabela crescente em col) */
  function faixa(tab, col, x) {
    if (x <= tab[0][col]) return 0;
    for (var i = 0; i < tab.length - 1; i++) if (x <= tab[i + 1][col]) return i;
    return tab.length - 2;
  }

  /* ---------------------------------------------------------------
     R-134a saturado — linhas [T °C, P kPa, vf, vg, hf, hg, sf, sg]
     --------------------------------------------------------------- */
  function satPor(col, x) {
    var t = R134A_SAT, i = faixa(t, col, x), a = t[i], b = t[i + 1], o = {};
    ['T', 'P', 'vf', 'vg', 'hf', 'hg', 'sf', 'sg'].forEach(function (k, j) {
      o[k] = interp(x, a[col], b[col], a[j], b[j]);
    });
    o.hfg = o.hg - o.hf; o.sfg = o.sg - o.sf;
    return o;
  }
  TD2.r134satT = function (T) { return satPor(0, T); };
  TD2.r134satP = function (PkPa) { return satPor(1, PkPa); };

  /* superaquecido — R134A_SUP[P MPa] = [[T|'sat', v, h, s], ...] */
  var PRESSOES = Object.keys(R134A_SUP).map(Number).sort(function (a, b) { return a - b; });
  TD2.PRESSOES_SUP = PRESSOES;
  function coluna(P) {
    var rows = R134A_SUP[String(P)] || R134A_SUP[P.toFixed(2).replace(/0$/, '')];
    if (!rows) {
      var k = Object.keys(R134A_SUP).filter(function (q) { return Math.abs(+q - P) < 1e-9; })[0];
      rows = R134A_SUP[k];
    }
    var Tsat = TD2.r134satP(P * 1000).T;
    return rows.map(function (r) { return [r[0] === 'sat' ? Tsat : r[0], r[1], r[2], r[3]]; });
  }
  /* propriedade (col 1 v, 2 h, 3 s) numa coluna de pressão, dada outra propriedade (colX) */
  function naColuna(P, colX, x, colY) {
    var c = coluna(P), i = faixa(c, colX, x);
    return interp(x, c[i][colX], c[i + 1][colX], c[i][colY], c[i + 1][colY]);
  }
  /* interpola entre as duas colunas de pressão vizinhas */
  function entrePressoes(PMPa, colX, x, colY) {
    var j = 0;
    while (j < PRESSOES.length - 2 && PMPa > PRESSOES[j + 1]) j++;
    var pa = PRESSOES[j], pb = PRESSOES[j + 1];
    var ya = naColuna(pa, colX, x, colY), yb = naColuna(pb, colX, x, colY);
    return interp(PMPa, pa, pb, ya, yb);
  }
  /* vapor superaquecido: h, s e v a partir de P (MPa) e T (°C) */
  TD2.r134supPT = function (PMPa, T) {
    return { h: entrePressoes(PMPa, 0, T, 2), s: entrePressoes(PMPa, 0, T, 3), v: entrePressoes(PMPa, 0, T, 1) };
  };
  /* a partir de P e s (compressão isentrópica) */
  TD2.r134supPs = function (PMPa, s) {
    return { h: entrePressoes(PMPa, 3, s, 2), T: entrePressoes(PMPa, 3, s, 0) };
  };
  /* a partir de P e h (saída real do compressor) */
  TD2.r134supPh = function (PMPa, h) {
    return { s: entrePressoes(PMPa, 2, h, 3), T: entrePressoes(PMPa, 2, h, 0) };
  };

  /* ---------------------------------------------------------------
     Ciclo de refrigeração por compressão de vapor (R-134a)
     p: Pevap (kPa), Pcond (kPa), sh (°C superaquec.), sc (°C subresfr.),
        eta (%), m (kg/s)
     --------------------------------------------------------------- */
  TD2.cicloVapor = function (p) {
    var ev = TD2.r134satP(p.Pevap), cd = TD2.r134satP(p.Pcond);
    var P1 = p.Pevap / 1000, P2 = p.Pcond / 1000;
    var e1;
    if (p.sh > 0.01) { var sp = TD2.r134supPT(P1, ev.T + p.sh); e1 = { T: ev.T + p.sh, h: sp.h, s: sp.s }; }
    else e1 = { T: ev.T, h: ev.hg, s: ev.sg };
    var i2s = TD2.r134supPs(P2, e1.s);
    var h2 = e1.h + (i2s.h - e1.h) / (p.eta / 100);
    var i2 = TD2.r134supPh(P2, h2);
    var T3 = cd.T - p.sc;
    var l3 = TD2.r134satT(T3);                       /* líquido comprimido ≈ líquido saturado a T3 */
    var e3 = { T: T3, h: l3.hf, s: l3.sf };
    var x4 = (e3.h - ev.hf) / ev.hfg;
    var e4 = { T: ev.T, h: e3.h, s: ev.sf + x4 * ev.sfg, x: x4 };
    var qL = e1.h - e4.h, w = h2 - e1.h, qH = h2 - e3.h;
    var TL = ev.T + 273.15, TH = cd.T + 273.15;
    return {
      ev: ev, cd: cd,
      e1: e1, e2s: { T: i2s.T, h: i2s.h, s: e1.s }, e2: { T: i2.T, h: h2, s: i2.s }, e3: e3, e4: e4,
      qL: qL, w: w, qH: qH, QL: p.m * qL, W: p.m * w, QH: p.m * qH,
      copR: qL / w, copHP: qH / w, copCarnotR: TL / (TH - TL), copCarnotHP: TH / (TH - TL),
      TR: p.m * qL / 3.51685           /* toneladas de refrigeração */
    };
  };

  /* ---------------------------------------------------------------
     Refrigeração a gás (Brayton reverso), ar com cp e k constantes
     p: T1 (°C, entrada do compressor), T3 (°C, após rejeitar calor), rp,
        etaC, etaT (%), m (kg/s), regen (0/1): regenerador ideal leva T3 a T1
     --------------------------------------------------------------- */
  TD2.cicloAr = function (p) {
    var cp = 1.005, k = 1.4, e = (k - 1) / k;
    var T1 = p.T1 + 273.15, T3 = p.T3 + 273.15;
    var T3r = p.regen ? T1 : T3;                   /* com regenerador, a turbina recebe o ar resfriado pelo retorno */
    var T2s = T1 * Math.pow(p.rp, e), T2 = T1 + (T2s - T1) / (p.etaC / 100);
    var T4s = T3r / Math.pow(p.rp, e), T4 = T3r - (p.etaT / 100) * (T3r - T4s);
    var qL = cp * (T1 - T4), wc = cp * (T2 - T1), wt = cp * (T3r - T4);
    var w = wc - wt;
    return { T1: T1, T2s: T2s, T2: T2, T3: T3, T3r: T3r, T4s: T4s, T4: T4, qL: qL, wc: wc, wt: wt, w: w,
             copR: qL / w, QL: p.m * qL, W: p.m * w, copIdeal: 1 / (Math.pow(p.rp, e) - 1), cp: cp, k: k };
  };

  /* ---------------------------------------------------------------
     Psicrometria — P em kPa, T em °C
     --------------------------------------------------------------- */
  TD2.Psat = function (T) {
    var t = AGUA_PSAT, i = faixa(t, 0, T);
    /* interpolação em ln P: a tabela é exponencial em T */
    var a = t[i], b = t[i + 1];
    return Math.exp(interp(T, a[0], b[0], Math.log(a[1]), Math.log(b[1])));
  };
  TD2.Tsat = function (P) {
    var t = AGUA_PSAT, i = faixa(t, 1, P);
    var a = t[i], b = t[i + 1];
    return interp(Math.log(P), Math.log(a[1]), Math.log(b[1]), a[0], b[0]);
  };
  var hg = function (T) { return 2501.3 + 1.82 * T; };
  var hf = function (T) { return 4.186 * T; };
  TD2.w = function (T, phi, P) { var Pv = phi * TD2.Psat(T); return 0.622 * Pv / (P - Pv); };
  TD2.phi = function (T, w, P) { return w * P / ((0.622 + w) * TD2.Psat(T)); };
  TD2.h = function (T, w) { return 1.005 * T + w * hg(T); };
  TD2.v = function (T, w, P) { var Pv = w * P / (0.622 + w); return 0.287 * (T + 273.15) / (P - Pv); };
  TD2.Torvalho = function (w, P) { return TD2.Tsat(w * P / (0.622 + w)); };
  /* bulbo úmido pela saturação adiabática: ω1 = [cp(T2 − T1) + ω2 hfg2] / (hg1 − hf2) */
  TD2.Tbu = function (T, w, P) {
    var lo = -10, hi = T, i;
    for (i = 0; i < 60; i++) {
      var T2 = (lo + hi) / 2;
      var w2 = TD2.w(T2, 1, P);
      var w1 = (1.005 * (T2 - T) + w2 * (hg(T2) - hf(T2))) / (hg(T) - hf(T2));
      if (w1 > w) hi = T2; else lo = T2;
    }
    return (lo + hi) / 2;
  };
  TD2.estado = function (T, phi, P) {
    var w = TD2.w(T, phi, P);
    return { T: T, phi: phi, w: w, h: TD2.h(T, w), v: TD2.v(T, w, P),
             Tdp: TD2.Torvalho(w, P), Twb: TD2.Tbu(T, w, P), Pv: phi * TD2.Psat(T), Pg: TD2.Psat(T) };
  };
  TD2.estadoTw = function (T, w, P) {
    var phi = TD2.phi(T, w, P);
    return { T: T, phi: phi, w: w, h: TD2.h(T, w), v: TD2.v(T, w, P),
             Tdp: TD2.Torvalho(w, P), Twb: TD2.Tbu(T, w, P), Pv: w * P / (0.622 + w), Pg: TD2.Psat(T) };
  };
  /* T a partir de h e ω (mistura adiabática) */
  TD2.Tdeh = function (h, w) { return (h - 2501.3 * w) / (1.005 + 1.82 * w); };

  /* processos de condicionamento de ar
     p: proc, P, T1, phi1, V1 (m³/min), T2, phi2, T3, phi3, V3 (segundo fluxo, na mistura) */
  TD2.processo = function (p) {
    var P = p.P, s1 = TD2.estado(p.T1, p.phi1 / 100, P);
    var ma = p.V1 / s1.v;                            /* kg de ar seco por minuto */
    var r = { s1: s1, ma: ma };
    if (p.proc === 'aquecimento') {
      var s2 = TD2.estadoTw(p.T2, s1.w, P);
      r.s2 = s2; r.Q = ma * (s2.h - s1.h); r.mw = 0;
    } else if (p.proc === 'resfriamento') {
      var s2r = TD2.estado(p.T2, p.phi2 / 100, P);
      if (s2r.w > s1.w) s2r = TD2.estadoTw(p.T2, s1.w, P);   /* sem condensação: só calor sensível */
      r.s2 = s2r; r.mw = ma * (s1.w - s2r.w);
      r.Q = ma * (s1.h - s2r.h) - r.mw * hf(p.T2);      /* calor retirado (positivo) */
    } else if (p.proc === 'evaporativo') {
      /* h ≈ constante (≈ Tbu constante); acha T2 com φ2 pedido */
      var lo = s1.Twb, hi = p.T1, k;
      for (k = 0; k < 60; k++) {
        var Tm = (lo + hi) / 2, wm = (s1.h - 1.005 * Tm) / hg(Tm);
        if (TD2.phi(Tm, wm, P) > p.phi2 / 100) lo = Tm; else hi = Tm;
      }
      var T2e = (lo + hi) / 2, w2e = (s1.h - 1.005 * T2e) / hg(T2e);
      r.s2 = TD2.estadoTw(T2e, w2e, P); r.mw = ma * (w2e - s1.w); r.Q = 0;
    } else if (p.proc === 'mistura') {
      var s3 = TD2.estado(p.T3, p.phi3 / 100, P), mb = p.V3 / s3.v;
      var w = (ma * s1.w + mb * s3.w) / (ma + mb), h = (ma * s1.h + mb * s3.h) / (ma + mb);
      var Tm2 = TD2.Tdeh(h, w);
      r.s3 = s3; r.mb = mb; r.s2 = TD2.estadoTw(Tm2, w, P); r.Q = 0; r.mw = 0;
      r.V2 = (ma + mb) * r.s2.v;
    }
    return r;
  };

  /* ---------------------------------------------------------------
     Escoamento compressível — gás ideal com k constante
     --------------------------------------------------------------- */
  TD2.iso = function (M, k) {
    var f = 1 + (k - 1) / 2 * M * M;
    return {
      T: 1 / f, P: Math.pow(f, -k / (k - 1)), rho: Math.pow(f, -1 / (k - 1)),
      A: M > 0 ? (1 / M) * Math.pow((2 / (k + 1)) * f, (k + 1) / (2 * (k - 1))) : Infinity,
      Mstar: M * Math.sqrt((k + 1) / (2 + (k - 1) * M * M))
    };
  };
  /* Mach a partir de A/A* — ramo subsônico ou supersônico */
  TD2.machDeA = function (AA, k, super_) {
    if (AA <= 1) return 1;
    var lo = super_ ? 1 : 1e-6, hi = super_ ? 50 : 1, i;
    for (i = 0; i < 100; i++) {
      var m = (lo + hi) / 2, a = TD2.iso(m, k).A;
      if (super_ ? a > AA : a < AA) hi = m; else lo = m;
    }
    return (lo + hi) / 2;
  };
  /* Mach a partir de P/P0 (sempre possível no ramo que se escolher pela física) */
  TD2.machDeP = function (PP0, k) {
    return Math.sqrt(2 / (k - 1) * (Math.pow(PP0, -(k - 1) / k) - 1));
  };
  TD2.choque = function (M1, k) {
    var M2 = Math.sqrt((M1 * M1 + 2 / (k - 1)) / (2 * k / (k - 1) * M1 * M1 - 1));
    var P21 = (1 + k * M1 * M1) / (1 + k * M2 * M2);
    var T21 = (1 + (k - 1) / 2 * M1 * M1) / (1 + (k - 1) / 2 * M2 * M2);
    var r21 = P21 / T21;
    var P0201 = (M1 / M2) * Math.pow((1 + (k - 1) / 2 * M2 * M2) / (1 + (k - 1) / 2 * M1 * M1), (k + 1) / (2 * (k - 1)));
    return { M2: M2, P21: P21, T21: T21, r21: r21, P0201: P0201, P02P1: P21 / TD2.iso(M2, k).P };
  };

  /* bocal convergente-divergente
     p: P0 (kPa), T0 (K), k, R (kJ/kg·K), At, Ae (cm²), Ai (cm²), Pb (kPa) */
  TD2.bocal = function (p) {
    var k = p.k, AeAt = p.Ae / p.At;
    var Msub = TD2.machDeA(AeAt, k, false), Msup = TD2.machDeA(AeAt, k, true);
    var Pc1 = p.P0 * TD2.iso(Msub, k).P;                 /* 1ª crítica: subsônico com garganta sônica */
    var Pc3 = p.P0 * TD2.iso(Msup, k).P;                 /* 3ª: projeto, supersônico sem choque */
    var Pc2 = Pc3 * TD2.choque(Msup, k).P21;             /* 2ª: choque normal exatamente na saída */
    var regime, Ashock = null, P0d = p.P0, Aestr = p.At, choked = true;
    if (p.Pb >= Pc1) {
      regime = p.Pb >= p.P0 ? 'sem escoamento' : 'subsônico em todo o bocal';
      choked = false;
      var Me = p.Pb >= p.P0 ? 0 : TD2.machDeP(p.Pb / p.P0, k);
      Aestr = Me > 0 ? p.Ae / TD2.iso(Me, k).A : Infinity;
    } else if (p.Pb >= Pc2) {
      regime = 'choque normal na seção divergente';
      /* acha a área do choque cuja pressão de saída é Pb */
      var lo = p.At * 1.000001, hi = p.Ae, i, sol;
      function pSaida(As) {
        var M1 = TD2.machDeA(As / p.At, k, true), c = TD2.choque(M1, k);
        var P02 = p.P0 * c.P0201, Astar2 = As / TD2.iso(c.M2, k).A;
        var Me2 = TD2.machDeA(p.Ae / Astar2, k, false);
        return { Pe: P02 * TD2.iso(Me2, k).P, P02: P02, Astar2: Astar2, M1: M1, c: c };
      }
      for (i = 0; i < 80; i++) {
        var mid = (lo + hi) / 2;
        sol = pSaida(mid);
        if (sol.Pe > p.Pb) lo = mid; else hi = mid;    /* choque mais a jusante → Pe menor */
      }
      Ashock = (lo + hi) / 2;
      sol = pSaida(Ashock);
      P0d = sol.P02;
    } else if (p.Pb > Pc3 * 1.001) regime = 'sobre-expandido (choques oblíquos fora do bocal)';
    else if (p.Pb >= Pc3 * 0.999) regime = 'condição de projeto';
    else regime = 'subexpandido (ondas de expansão fora do bocal)';

    /* vazão */
    var R = p.R * 1000, m;
    if (choked) m = p.At * 1e-4 * p.P0 * 1000 * Math.sqrt(k / (R * p.T0)) * Math.pow(2 / (k + 1), (k + 1) / (2 * (k - 1)));
    else {
      var Me0 = TD2.machDeP(p.Pb / p.P0, k), is = TD2.iso(Me0, k);
      var Te = p.T0 * is.T, rhoE = p.Pb * 1000 / (R * Te);
      m = p.Pb < p.P0 ? rhoE * Me0 * Math.sqrt(k * R * Te) * p.Ae * 1e-4 : 0;
    }

    /* perfil ao longo do bocal: x ∈ [0,1], garganta em x = 0,4 */
    var perfil = [], n = 120, xg = 0.4;
    function area(x) {
      if (x <= xg) { var u = x / xg; return p.Ai + (p.At - p.Ai) * (1 - Math.cos(Math.PI * u)) / 2; }
      var v = (x - xg) / (1 - xg); return p.At + (p.Ae - p.At) * (1 - Math.cos(Math.PI * v)) / 2;
    }
    for (var j = 0; j <= n; j++) {
      var x = j / n, A = area(x), M, P0loc = p.P0;
      if (!choked) {
        M = isFinite(Aestr) ? TD2.machDeA(A / Aestr, k, false) : 0;
      } else if (x <= xg) M = TD2.machDeA(A / p.At, k, false);
      else if (Ashock !== null && A >= Ashock) {
        M = TD2.machDeA(A / sol.Astar2, k, false); P0loc = P0d;
      } else M = TD2.machDeA(A / p.At, k, true);
      var ii = TD2.iso(M, k);
      perfil.push({ x: x, A: A, M: M, P: P0loc * ii.P, T: p.T0 * ii.T, V: M * Math.sqrt(k * R * p.T0 * ii.T) });
    }
    var xShock = null;
    if (Ashock !== null) {
      for (j = 0; j < perfil.length; j++) if (perfil[j].x > xg && perfil[j].A >= Ashock) { xShock = perfil[j].x; break; }
    }
    return { regime: regime, choked: choked, Pc1: Pc1, Pc2: Pc2, Pc3: Pc3, Msub: Msub, Msup: Msup,
             Ashock: Ashock, xShock: xShock, P0d: P0d, m: m, perfil: perfil, area: area, xg: xg,
             choqueInfo: Ashock !== null ? sol : null };
  };

  global.TD2 = TD2;
})(typeof window !== 'undefined' ? window : global);

/* ==========================================================================
   Termodinâmica II — simuladores
     1. sim-refrigeracao    : compressão de vapor com R-134a (refrigerador e
                              bomba de calor), diagramas P-h e T-s
     2. sim-refrigeracao-ar : ciclo de refrigeração a gás (Brayton reverso)
     3. sim-psicrometria    : carta psicrométrica e processos de ar-condicionado
     4. sim-bocal           : bocal convergente-divergente, choque normal
   Os ciclos de potência (Rankine, Otto/Diesel, Brayton) vêm de ciclos.js.
   ========================================================================== */
(function () {
  'use strict';
  var TD2 = window.TD2;
  var TAU = Math.PI * 2;

  var quadros = [];
  function registrar(fn) { quadros.push(fn); }
  (function laco() {
    for (var i = 0; i < quadros.length; i++) {
      try { quadros[i](); } catch (e) { /* um modelo com erro não trava os outros */ }
    }
    requestAnimationFrame(laco);
  })();
  function relogio() {
    return { t: 0, dt: function () {
      var agora = performance.now();
      var d = this.t ? (agora - this.t) / 1000 : 0.016;
      this.t = agora;
      return (d > 0.2 || d <= 0) ? 0.016 : d;
    } };
  }
  function fonte(px, peso) {
    return (peso ? peso + ' ' : '') + px + 'px ' + Plot.cssVar('--font', 'sans-serif');
  }
  function seta(c, x1, y1, x2, y2, cor, larg, cabeca) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 1.5) return;
    var ux = dx / L, uy = dy / L, h = cabeca || Math.min(10, L * 0.45);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.45, y2 - uy * h - ux * h * 0.45);
    c.lineTo(x2 - ux * h - uy * h * 0.45, y2 - uy * h + ux * h * 0.45);
    c.closePath(); c.fill();
  }
  function comprimento(pts) {
    var L = 0;
    for (var i = 0; i < pts.length - 1; i++) L += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    return L;
  }
  function naPolilinha(pts, s) {
    var tot = comprimento(pts), alvo = ((s % 1) + 1) % 1 * tot, i;
    for (i = 0; i < pts.length - 1; i++) {
      var L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      if (alvo <= L || i === pts.length - 2) {
        var f = L > 0 ? alvo / L : 0;
        return [pts[i][0] + f * (pts[i + 1][0] - pts[i][0]), pts[i][1] + f * (pts[i + 1][1] - pts[i][1])];
      }
      alvo -= L;
    }
    return pts[pts.length - 1];
  }
  function tubo(c, pts, cor, larg) {
    c.setLineDash([]); c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = Plot.cssVar('--border-strong', '#999'); c.lineWidth = larg + 3;
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.stroke();
    c.strokeStyle = cor; c.globalAlpha = 0.35; c.lineWidth = larg; c.stroke(); c.globalAlpha = 1;
    c.lineCap = 'butt';
  }
  /* azul frio → vermelho quente */
  function corTemp(T, Tmin, Tmax) {
    var f = Math.max(0, Math.min(1, (T - Tmin) / (Tmax - Tmin)));
    return 'rgb(' + Math.round(50 + 205 * f) + ',' + Math.round(120 + 40 * Math.sin(f * Math.PI) - 70 * f) + ',' + Math.round(230 - 200 * f) + ')';
  }
  function serpentina(c, x, y, w, h, n, cor) {
    c.strokeStyle = cor; c.lineWidth = 2.4; c.beginPath();
    for (var i = 0; i <= n; i++) {
      var xx = x + w * i / n;
      if (i === 0) c.moveTo(xx, y);
      c.lineTo(xx, i % 2 ? y + h : y);
      if (i < n) c.lineTo(x + w * (i + 1) / n, i % 2 ? y + h : y);
    }
    c.stroke();
  }
  var nt = function (v, n) { return Plot.numTex(v, n); };
  var sg = function (v, n) { return Plot.sig(v, n); };

  /* domo de saturação do R-134a, para os diagramas */
  function domoR134() {
    var liq = [], vap = [];
    R134A_SAT.forEach(function (r) {
      if (r[1] > 1600) return;
      liq.push({ T: r[0], P: r[1], h: r[4], s: r[6] });
      vap.push({ T: r[0], P: r[1], h: r[5], s: r[7] });
    });
    return { liq: liq, vap: vap };
  }

  /* ==========================================================================
     1. Refrigeração por compressão de vapor
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-refrigeracao')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, t = A.t, k;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var bomba = p.modo === 'bomba';
      var Tmin = r.e4.T - 5, Tmax = Math.max(r.e2.T, r.cd.T + 10);

      /* laço do refrigerante: 1 (saída do evaporador) → compressor → 2 → condensador → 3 → válvula → 4 → evaporador */
      var xL = X0 + W * 0.10, xR = X0 + W * 0.56, yT = Y0 + H * 0.22, yB = Y0 + H * 0.78;
      var comp = [xR, (yT + yB) / 2], valv = [xL, (yT + yB) / 2];
      var cond = { x: X0 + W * 0.17, y: yT - 16, w: W * 0.31, h: 32 };
      var evap = { x: X0 + W * 0.17, y: yB - 16, w: W * 0.31, h: 32 };
      /* caminho completo, sentido do escoamento: 1 → 2 → 3 → 4 → 1 */
      var caminho = [
        [evap.x + evap.w, yB], [xR, yB], [xR, comp[1] + 22],             /* 1 → compressor */
        [xR, comp[1] - 22], [xR, yT], [cond.x + cond.w, yT],            /* compressor → 2 → condensador */
        [cond.x, yT], [xL, yT], [xL, valv[1] - 12],                     /* condensador → 3 → válvula */
        [xL, valv[1] + 12], [xL, yB], [evap.x, yB], [evap.x + evap.w, yB] /* 4 → evaporador → 1 */
      ];
      tubo(c, caminho, corTemp((r.e1.T + r.e2.T) / 2, Tmin, Tmax), 5);

      /* ambientes: o espaço refrigerado embaixo, o meio quente em cima */
      c.fillStyle = bomba ? 'rgba(80,150,230,0.10)' : 'rgba(80,150,230,0.16)';
      c.fillRect(X0 + W * 0.15, yB + 22, W * 0.44, H * 0.20);
      c.fillStyle = 'rgba(230,110,60,0.12)';
      c.fillRect(X0 + W * 0.15, Y0 + 2, W * 0.44, yT - 24 - Y0);
      c.fillStyle = faint; c.font = fonte(10, '700'); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(bomba ? 'ar externo frio (fonte de calor) · ' + sg(r.ev.T + 8, 3) + ' °C' : 'espaço refrigerado · ' + sg(r.ev.T + 8, 3) + ' °C',
                 X0 + W * 0.37, yB + 22 + H * 0.15);
      c.fillText(bomba ? 'interior da casa (efeito útil) · ' + sg(r.cd.T - 10, 3) + ' °C' : 'ambiente (rejeição de calor) · ' + sg(r.cd.T - 10, 3) + ' °C',
                 X0 + W * 0.37, Y0 + (yT - 24 - Y0) * 0.35 + 2);

      /* condensador e evaporador */
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.fillRect(cond.x, cond.y, cond.w, cond.h); c.strokeRect(cond.x, cond.y, cond.w, cond.h);
      serpentina(c, cond.x + 6, cond.y + 7, cond.w - 12, cond.h - 14, 16, corTemp(r.cd.T, Tmin, Tmax));
      c.fillRect(evap.x, evap.y, evap.w, evap.h); c.strokeRect(evap.x, evap.y, evap.w, evap.h);
      serpentina(c, evap.x + 6, evap.y + 7, evap.w - 12, evap.h - 14, 16, corTemp(r.ev.T, Tmin, Tmax));
      c.fillStyle = cor; c.font = fonte(10.5, '700'); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Condensador', cond.x + cond.w / 2, cond.y - 9);
      c.fillText('Evaporador', evap.x + evap.w / 2, evap.y + evap.h + 10);

      /* calor: setas pulsando, largura ∝ taxa */
      var fq = 1 + 0.15 * Math.sin(t * 5);
      var lH = Math.min(7, 2 + r.QH / 3), lL = Math.min(7, 2 + r.QL / 3);
      for (k = 0; k < 3; k++) {
        var xq = cond.x + cond.w * (0.25 + 0.25 * k);
        seta(c, xq, cond.y - 18, xq, cond.y - 18 - 20 * fq, 'rgb(230,90,50)', lH, 9);
        var xe = evap.x + evap.w * (0.25 + 0.25 * k);
        seta(c, xe, evap.y + evap.h + 42 + 20 * fq, xe, evap.y + evap.h + 22, 'rgb(60,140,230)', lL, 9);
      }
      c.font = fonte(11, '700'); c.textAlign = 'left';
      c.fillStyle = 'rgb(230,90,50)';
      c.fillText('Q_H = ' + sg(r.QH, 3) + ' kW', cond.x + cond.w + 8, cond.y - 26);
      c.fillStyle = 'rgb(60,140,230)';
      c.fillText('Q_L = ' + sg(r.QL, 3) + ' kW', evap.x + evap.w + 8, evap.y + evap.h + 34);

      /* compressor: cilindro com pistão oscilando */
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath(); c.arc(comp[0], comp[1], 22, 0, TAU); c.fill(); c.stroke();
      var ang = t * 9;
      c.strokeStyle = corTemp(r.e2.T, Tmin, Tmax); c.lineWidth = 3;
      for (k = 0; k < 3; k++) {
        c.beginPath(); c.moveTo(comp[0], comp[1]);
        c.lineTo(comp[0] + 16 * Math.cos(ang + k * TAU / 3), comp[1] + 16 * Math.sin(ang + k * TAU / 3)); c.stroke();
      }
      seta(c, comp[0] + 58, comp[1], comp[0] + 26, comp[1], Plot.serie(3), Math.min(6, 2 + r.W), 9);
      c.fillStyle = Plot.serie(3); c.font = fonte(11, '700'); c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('W = ' + sg(r.W, 3) + ' kW', comp[0] + 28, comp[1] + 8);
      c.fillStyle = cor; c.font = fonte(10.5, '700'); c.textAlign = 'right';
      c.fillText('Compressor', comp[0] - 28, comp[1]);

      /* válvula de expansão: dois triângulos */
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(valv[0] - 10, valv[1] - 12); c.lineTo(valv[0] + 10, valv[1] - 12); c.lineTo(valv[0], valv[1]);
      c.closePath(); c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(valv[0] - 10, valv[1] + 12); c.lineTo(valv[0] + 10, valv[1] + 12); c.lineTo(valv[0], valv[1]);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = cor; c.textAlign = 'left';
      c.fillText('Válvula de', valv[0] + 16, valv[1] - 6);
      c.fillText('expansão', valv[0] + 16, valv[1] + 8);

      /* partículas: líquido = ponto cheio, vapor = anel; T pela cor */
      var Ltot = comprimento(caminho), n = 46;
      /* marcos do caminho (fração do comprimento) */
      var acum = [0], i;
      for (i = 0; i < caminho.length - 1; i++) acum.push(acum[i] + Math.hypot(caminho[i + 1][0] - caminho[i][0], caminho[i + 1][1] - caminho[i][1]));
      function fr(idx) { return acum[idx] / Ltot; }
      var fComp0 = fr(2), fComp1 = fr(3), fCond0 = fr(5), fCond1 = fr(6), fVal = fr(9), fEv0 = fr(11), fEv1 = fr(12);
      for (k = 0; k < n; k++) {
        var s = (t * 0.10 + k / n) % 1, pt = naPolilinha(caminho, s);
        var x, T;
        if (s < fComp0) { x = 1; T = r.e1.T; }
        else if (s < fComp1) { x = 1; T = r.e1.T + (r.e2.T - r.e1.T) * (s - fComp0) / (fComp1 - fComp0); }
        else if (s < fCond0) { x = 1; T = r.e2.T; }
        else if (s < fCond1) {
          var u = (s - fCond0) / (fCond1 - fCond0);
          x = Math.max(0, 1 - 1.15 * u); T = u < 0.15 ? r.e2.T + (r.cd.T - r.e2.T) * u / 0.15 : r.cd.T;
        }
        else if (s < fVal) { x = 0; T = r.e3.T; }
        else if (s < fEv0) { x = r.e4.x; T = r.e4.T; }
        else { var u2 = (s - fEv0) / (fEv1 - fEv0); x = r.e4.x + (1 - r.e4.x) * Math.min(1, u2 * 1.1); T = r.e4.T; }
        var corP = corTemp(T, Tmin, Tmax);
        /* mistura: fração de anéis = título */
        var vapor = ((k * 0.618) % 1) < x;
        c.fillStyle = corP; c.strokeStyle = corP; c.lineWidth = 1.6;
        c.beginPath(); c.arc(pt[0], pt[1], vapor ? 3.2 : 2.6, 0, TAU);
        if (vapor) c.stroke(); else c.fill();
      }

      /* estados */
      var est = [
        ['1', [evap.x + evap.w + (xR - evap.x - evap.w) / 2, yB], r.e1, 'vapor', 0, 16],
        ['2', [xR, yT + (comp[1] - yT) / 2 - 18], r.e2, 'vapor quente', -128, 0],
        ['3', [xL, yT + (valv[1] - yT) / 2 - 16], r.e3, 'líquido', 10, 0],
        ['4', [xL, yB - (yB - valv[1]) / 2 + 14], r.e4, 'mistura x = ' + sg(r.e4.x, 2), 10, 0]
      ];
      est.forEach(function (e) {
        var px = e[1][0] + e[4], py = e[1][1] + e[5];
        c.fillStyle = Plot.serie(6);
        c.beginPath(); c.arc(e[1][0], e[1][1], 9, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.font = fonte(10, '700'); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(e[0], e[1][0], e[1][1]);
        c.fillStyle = cor; c.font = fonte(9.5); c.textAlign = e[4] < 0 ? 'right' : 'left'; c.textBaseline = 'top';
        var xt = e[4] < 0 ? e[1][0] - 14 : px + 6;
        c.fillText(sg(e[2].T, 3) + ' °C · h ' + sg(e[2].h, 4), xt, py);
        c.fillStyle = faint; c.fillText(e[3], xt, py + 12);
      });

      /* painel */
      var lx = X0 + W * 0.79, ly = Y0 + 8;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12, '700');
      c.fillText(bomba ? 'Bomba de calor' : 'Refrigerador', lx, ly);
      c.font = fonte(10.5); c.fillStyle = faint;
      c.fillText('R-134a (tabelas)', lx, ly + 17);
      var linhas = [
        ['evaporador', sg(p.Pevap, 4) + ' kPa · ' + sg(r.ev.T, 3) + ' °C'],
        ['condensador', sg(p.Pcond, 4) + ' kPa · ' + sg(r.cd.T, 3) + ' °C'],
        [bomba ? 'COP_BC' : 'COP_R', sg(bomba ? r.copHP : r.copR, 3)],
        ['COP de Carnot', sg(bomba ? r.copCarnotHP : r.copCarnotR, 3)],
        ['capacidade', sg(r.TR, 3) + ' TR']
      ];
      linhas.forEach(function (ln, j) {
        c.fillStyle = faint; c.font = fonte(9.5); c.fillText(ln[0], lx, ly + 40 + j * 30);
        c.fillStyle = cor; c.font = fonte(11, '700'); c.fillText(ln[1], lx, ly + 52 + j * 30);
      });
      c.fillStyle = faint; c.font = fonte(9);
      c.fillText('● líquido   ○ vapor', lx, ly + 200);
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('planta');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-refrigeracao', {
      titulo: 'Refrigeração por compressão de vapor — R-134a',
      descricao: 'O refrigerante ferve no evaporador a baixa pressão, roubando calor do espaço frio; o compressor eleva a pressão para que ele condense acima da temperatura ambiente e devolva esse calor fora. Propriedades lidas das tabelas A-11 a A-13 do Çengel, como nas listas.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo 11-1 do Çengel', desc: '0,14 → 0,8 MPa, ideal, 0,05 kg/s', valores: { modo: 'refrigerador', Pevap: 140, Pcond: 800, sh: 0, sc: 0, eta: 100, m: 0.05, animar: true } },
        { nome: '2 · Geladeira doméstica', desc: 'Evaporador a −26 °C, condensador a 43 °C', valores: { modo: 'refrigerador', Pevap: 100, Pcond: 1100, sh: 5, sc: 3, eta: 75, m: 0.004, animar: true } },
        { nome: '3 · Ar-condicionado', desc: 'Evaporador a +5 °C', valores: { modo: 'refrigerador', Pevap: 350, Pcond: 1200, sh: 5, sc: 5, eta: 80, m: 0.12, animar: true } },
        { nome: '4 · Bomba de calor no inverno', desc: 'O mesmo ciclo, aproveitando Q_H', valores: { modo: 'bomba', Pevap: 200, Pcond: 1000, sh: 3, sc: 3, eta: 80, m: 0.08, animar: true } },
        { nome: '5 · Compressor gasto', desc: 'η = 60 %: o COP despenca', valores: { modo: 'refrigerador', Pevap: 140, Pcond: 800, sh: 0, sc: 0, eta: 60, m: 0.05, animar: true } },
        { nome: '6 · Condensador sujo', desc: 'Condensa a 1,4 MPa em vez de 0,8', valores: { modo: 'refrigerador', Pevap: 140, Pcond: 1400, sh: 0, sc: 0, eta: 100, m: 0.05, animar: true } }
      ],
      controles: [
        { id: 'modo', tipo: 'select', label: 'Uso do ciclo', valor: 'refrigerador',
          opcoes: [{ v: 'refrigerador', t: 'Refrigerador (efeito útil: Q_L)' }, { v: 'bomba', t: 'Bomba de calor (efeito útil: Q_H)' }] },
        { tipo: 'titulo', label: 'Pressões' },
        { id: 'Pevap', label: 'Pressão no evaporador', min: 60, max: 500, step: 1, valor: 140, unidade: 'kPa',
          desc: 'define a temperatura de ebulição: 0,14 MPa → −18,8 °C' },
        { id: 'Pcond', label: 'Pressão no condensador', min: 500, max: 1600, step: 1, valor: 800, unidade: 'kPa',
          desc: '0,8 MPa → 31,3 °C · tem de ficar acima da temperatura do ambiente' },
        { tipo: 'titulo', label: 'Ciclo real' },
        { id: 'sh', label: 'Superaquecimento na saída do evaporador', min: 0, max: 15, step: 0.5, valor: 0, unidade: '°C' },
        { id: 'sc', label: 'Subresfriamento na saída do condensador', min: 0, max: 10, step: 0.5, valor: 0, unidade: '°C' },
        { id: 'eta', label: 'Eficiência isentrópica do compressor', min: 50, max: 100, step: 1, valor: 100, unidade: '%' },
        { id: 'm', label: 'Vazão de refrigerante', min: 0.002, max: 0.3, step: 0.001, valor: 0.05, unidade: 'kg/s' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'planta', axes: false, height: 420, grid: false, legend: false },
        { id: 'ph', titulo: 'Diagrama P-h (o diagrama dos frigoristas)', xlabel: 'Entalpia h (kJ/kg)', ylabel: 'Pressão (kPa)',
          aspect: 0.52, ylog: true, legendPos: 'topleft' },
        { id: 'ts', titulo: 'Diagrama T-s', xlabel: 'Entropia s (kJ/kg·K)', ylabel: 'Temperatura (°C)', aspect: 0.48, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'QL', label: 'Calor retirado Q_L' },
        { id: 'W', label: 'Potência do compressor' },
        { id: 'QH', label: 'Calor rejeitado Q_H' },
        { id: 'cop', label: 'COP' },
        { id: 'carnot', label: 'COP de Carnot' },
        { id: 'T2', label: 'Descarga do compressor' },
        { id: 'x4', label: 'Título na entrada do evaporador' },
        { id: 'TR', label: 'Capacidade' }
      ],
      formulas: [
        { g: 'Os quatro processos do ciclo ideal' },
        { tex: '1\\to2:\\ s_2 = s_1 \\qquad 2\\to3:\\ P = P_{cond} \\qquad 3\\to4:\\ h_4 = h_3 \\qquad 4\\to1:\\ P = P_{evap}',
          d: 'compressão isentrópica, condensação, estrangulamento, evaporação', destaque: true },
        { tex: 'h_4 = h_3', d: 'a válvula não troca calor nem trabalho: estrangulamento isentálpico — e irreversível' },
        { g: 'Balanços' },
        { tex: '\\dot Q_L = \\dot m\\,(h_1 - h_4) \\qquad \\dot W = \\dot m\\,(h_2 - h_1) \\qquad \\dot Q_H = \\dot m\\,(h_2 - h_3)', destaque: true },
        { tex: '\\dot Q_H = \\dot Q_L + \\dot W', d: 'primeira lei no ciclo' },
        { tex: 'h_2 = h_1 + \\frac{h_{2s} - h_1}{\\eta_c}', d: 'compressor real' },
        { g: 'Desempenho' },
        { tex: 'COP_R = \\frac{\\dot Q_L}{\\dot W} \\qquad COP_{BC} = \\frac{\\dot Q_H}{\\dot W} = COP_R + 1', destaque: true },
        { tex: 'COP_{R,Carnot} = \\frac{T_L}{T_H - T_L}', d: 'teto teórico, temperaturas em kelvin' },
        { tex: '1\\ TR = 3{,}517\\ kW = 211\\ kJ/min', d: 'tonelada de refrigeração: fundir 1 t de gelo em 24 h' }
      ],
      passos: [],
      nota: 'Propriedades do R-134a por interpolação linear nas tabelas A-11, A-12 e A-13 (Çengel, 6ª ed.), como nas listas de exercícios. O líquido subresfriado é aproximado por líquido saturado à mesma temperatura. Não há perda de carga nas linhas nem troca de calor com o ambiente fora dos trocadores.',
      calcular: function (p, ctx) {
        var r = TD2.cicloVapor(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();
        var bomba = p.modo === 'bomba';
        var domo = domoR134();

        var g = ctx.plot('ph').clear();
        g.line(domo.liq.map(function (q) { return q.h; }), domo.liq.map(function (q) { return Math.log10(q.P); }), { color: Plot.cssVar('--text-faint', '#999'), width: 1.8, label: 'líquido saturado' });
        g.line(domo.vap.map(function (q) { return q.h; }), domo.vap.map(function (q) { return Math.log10(q.P); }), { color: Plot.cssVar('--text-faint', '#999'), width: 1.8, dash: [5, 3], label: 'vapor saturado' });
        var lp1 = Math.log10(p.Pevap), lp2 = Math.log10(p.Pcond);
        /* compressão em várias pressões intermediárias, pela isentrópica real */
        var cx = [r.e1.h], cy = [lp1];
        for (var j = 1; j <= 10; j++) {
          var Pm = p.Pevap * Math.pow(p.Pcond / p.Pevap, j / 10);
          var hs = TD2.r134supPs(Pm / 1000, r.e1.s).h;
          cx.push(r.e1.h + (hs - r.e1.h) / (p.eta / 100)); cy.push(Math.log10(Pm));
        }
        g.line(cx, cy, { color: Plot.serie(3), width: 2.8, label: 'compressão 1→2' });
        g.line([r.e2.h, r.cd.hg, r.cd.hf, r.e3.h], [lp2, lp2, lp2, lp2], { color: 'rgb(230,90,50)', width: 2.8, label: 'condensador 2→3' });
        g.line([r.e3.h, r.e4.h], [lp2, lp1], { color: Plot.serie(5), width: 2.8, label: 'válvula 3→4' });
        g.line([r.e4.h, r.e1.h], [lp1, lp1], { color: 'rgb(60,140,230)', width: 2.8, label: 'evaporador 4→1' });
        if (p.eta < 99.5) g.line([r.e1.h, r.e2s.h], [lp1, lp2], { color: Plot.serie(3), width: 1.2, dash: [3, 3] });
        [['1', r.e1.h, lp1], ['2', r.e2.h, lp2], ['3', r.e3.h, lp2], ['4', r.e4.h, lp1]].forEach(function (q) {
          g.marker(q[1], q[2], q[0], { color: Plot.serie(6), r: 4.5 });
        });
        g.setLimits([0, 330], [Math.log10(50), Math.log10(2000)]);
        g.draw();

        var gt = ctx.plot('ts').clear();
        gt.line(domo.liq.map(function (q) { return q.s; }), domo.liq.map(function (q) { return q.T; }), { color: Plot.cssVar('--text-faint', '#999'), width: 1.8 });
        gt.line(domo.vap.map(function (q) { return q.s; }), domo.vap.map(function (q) { return q.T; }), { color: Plot.cssVar('--text-faint', '#999'), width: 1.8, dash: [5, 3] });
        var sx = [r.e1.s], ty = [r.e1.T];
        for (j = 1; j <= 10; j++) {
          var Pm2 = p.Pevap * Math.pow(p.Pcond / p.Pevap, j / 10);
          var hs2 = TD2.r134supPs(Pm2 / 1000, r.e1.s).h, hr = r.e1.h + (hs2 - r.e1.h) / (p.eta / 100);
          var q2 = TD2.r134supPh(Pm2 / 1000, hr); sx.push(q2.s); ty.push(q2.T);
        }
        gt.line(sx, ty, { color: Plot.serie(3), width: 2.8, label: 'compressão' });
        gt.line([r.e2.s, r.cd.sg, r.cd.sf, r.e3.s], [r.e2.T, r.cd.T, r.cd.T, r.e3.T], { color: 'rgb(230,90,50)', width: 2.8, label: 'condensação' });
        gt.line([r.e3.s, r.e4.s], [r.e3.T, r.e4.T], { color: Plot.serie(5), width: 2.4, dash: [4, 3], label: 'estrangulamento (irreversível)' });
        gt.line([r.e4.s, r.ev.sg, r.e1.s], [r.e4.T, r.ev.T, r.e1.T], { color: 'rgb(60,140,230)', width: 2.8, label: 'evaporação' });
        [['1', r.e1], ['2', r.e2], ['3', r.e3], ['4', r.e4]].forEach(function (q) {
          gt.marker(q[1].s, q[1].T, q[0], { color: Plot.serie(6), r: 4.5 });
        });
        gt.draw();

        var ev = r.ev, cd = r.cd;
        var passos = [];
        passos.push({ t: '① Estado 1 — saída do evaporador (tabela A-12 / A-13)',
          tex: p.sh > 0 ? 'P_1 = P_{evap},\\ T_1 = T_{sat} + \\Delta T_{sa}' : 'P_1 = P_{evap},\\ \\text{vapor saturado}',
          texSub: 'P_1 = ' + nt(p.Pevap, 4) + '\\ kPa \\Rightarrow T_{sat} = ' + nt(ev.T, 4) + '\\,{}^\\circ C,\\ h_1 = ' + nt(r.e1.h, 5) + '\\ kJ/kg,\\ s_1 = ' + nt(r.e1.s, 5) + '\\ kJ/kg\\cdot K',
          obs: 'O superaquecimento na saída do evaporador existe de propósito: garante que só vapor entre no compressor. Gota de líquido num compressor alternativo é golpe de líquido — quebra válvulas.' });
        passos.push({ t: '② Estado 2 — compressão até a pressão do condensador',
          tex: 's_{2s} = s_1 \\;\\Rightarrow\\; h_{2s}\\ (\\text{A-13}), \\qquad h_2 = h_1 + \\frac{h_{2s} - h_1}{\\eta_c}',
          texSub: 'h_{2s} = ' + nt(r.e2s.h, 5) + ' \\;\\Rightarrow\\; h_2 = ' + nt(r.e1.h, 5) + ' + \\frac{' + nt(r.e2s.h, 5) + ' - ' + nt(r.e1.h, 5) + '}{' + nt(p.eta / 100) + '} = ' + nt(r.e2.h, 5) + '\\ kJ/kg,\\ T_2 = ' + nt(r.e2.T, 3) + '\\,{}^\\circ C',
          obs: 'Na tabela de vapor superaquecido a ' + sg(p.Pcond / 1000, 3) + ' MPa, procura-se a linha com s = ' + sg(r.e1.s, 4) + ' e interpola-se para achar h e T. É exatamente o que o simulador faz, entre as duas colunas de pressão vizinhas.' });
        passos.push({ t: '③ Estado 3 — saída do condensador',
          tex: p.sc > 0 ? 'h_3 \\approx h_f(T_3),\\ T_3 = T_{sat} - \\Delta T_{sr}' : 'h_3 = h_f\\,(P_{cond})',
          texSub: 'T_{sat}(' + nt(p.Pcond, 4) + '\\ kPa) = ' + nt(cd.T, 4) + '\\,{}^\\circ C \\;\\Rightarrow\\; h_3 = ' + nt(r.e3.h, 5) + '\\ kJ/kg',
          obs: 'Subresfriar o líquido antes da válvula reduz h₃ — e portanto h₄ — aumentando o efeito refrigerante por kg sem gastar mais trabalho de compressão.' });
        passos.push({ t: '④ Estado 4 — depois da válvula de expansão',
          tex: 'h_4 = h_3, \\qquad x_4 = \\frac{h_4 - h_f}{h_{fg}}',
          texSub: 'x_4 = \\frac{' + nt(r.e4.h, 5) + ' - ' + nt(ev.hf, 4) + '}{' + nt(ev.hfg, 5) + '} = ' + nt(r.e4.x, 3),
          obs: sg(100 * r.e4.x, 2) + ' % do refrigerante já chega ao evaporador como vapor, sem ter retirado calor nenhum: é a perda do estrangulamento. Uma turbina no lugar da válvula recuperaria isso, mas para um fluxo tão pequeno não compensa.' });
        passos.push({ t: '⑤ Balanços de energia',
          tex: '\\dot Q_L = \\dot m(h_1 - h_4),\\quad \\dot W = \\dot m(h_2 - h_1),\\quad \\dot Q_H = \\dot m(h_2 - h_3)',
          texSub: '\\dot Q_L = ' + nt(p.m) + '(' + nt(r.e1.h, 5) + ' - ' + nt(r.e4.h, 5) + ') = ' + nt(r.QL, 4) + '\\ kW,\\quad \\dot W = ' + nt(r.W, 4) + '\\ kW,\\quad \\dot Q_H = ' + nt(r.QH, 4) + '\\ kW',
          obs: 'Confere: Q_H = Q_L + W = ' + sg(r.QL + r.W, 4) + ' kW. Todo o trabalho do compressor também sai pelo condensador.' });
        passos.push({ t: '⑥ Coeficiente de desempenho',
          tex: bomba ? 'COP_{BC} = \\frac{\\dot Q_H}{\\dot W}' : 'COP_R = \\frac{\\dot Q_L}{\\dot W}',
          texSub: bomba ? 'COP_{BC} = \\frac{' + nt(r.QH, 4) + '}{' + nt(r.W, 4) + '} = ' + nt(r.copHP, 3) + ' \\quad (\\text{Carnot: } ' + nt(r.copCarnotHP, 3) + ')'
                        : 'COP_R = \\frac{' + nt(r.QL, 4) + '}{' + nt(r.W, 4) + '} = ' + nt(r.copR, 3) + ' \\quad (\\text{Carnot: } ' + nt(r.copCarnotR, 3) + ')',
          obs: bomba ? 'Cada kW de eletricidade entrega ' + sg(r.copHP, 3) + ' kW de calor em casa — por isso a bomba de calor bate qualquer aquecedor resistivo, que entrega exatamente 1.'
                     : 'O COP maior que 1 não viola nada: o compressor não produz o frio, ele só bombeia calor morro acima. Quanto maior a diferença entre as pressões, maior o trabalho — e menor o COP.' });
        ctx.setPassos(passos);

        return {
          QL: { v: r.QL, u: 'kW' },
          W: { v: r.W, u: 'kW' },
          QH: { v: r.QH, u: 'kW' },
          cop: { v: bomba ? r.copHP : r.copR, u: bomba ? 'bomba de calor' : 'refrigerador', classe: 'destaque' },
          carnot: { v: bomba ? r.copCarnotHP : r.copCarnotR, u: '' },
          T2: { v: r.e2.T, u: '°C' },
          x4: { v: r.e4.x, u: '' },
          TR: { v: r.TR, u: 'TR' }
        };
      }
    });
  })();

  /* ==========================================================================
     2. Refrigeração a gás — ciclo Brayton reverso
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-refrigeracao-ar')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, t = A.t, k;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var C = function (T) { return corTemp(T - 273.15, r.T4 - 273.15 - 5, r.T2 - 273.15); };
      var yT = Y0 + H * 0.18, yB = Y0 + H * 0.82, yM = (yT + yB) / 2;
      var xC = X0 + W * 0.52, xTb = X0 + W * 0.18;

      /* eixo compartilhado: turbina à esquerda, compressor à direita */
      c.strokeStyle = cor; c.lineWidth = 4;
      c.beginPath(); c.moveTo(xTb + 26, yM); c.lineTo(xC - 26, yM); c.stroke();
      var ang = t * 10;
      function maquina(x, larg1, larg2, nome, T, gira) {
        c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x - 26, yM - larg1); c.lineTo(x + 26, yM - larg2); c.lineTo(x + 26, yM + larg2); c.lineTo(x - 26, yM + larg1);
        c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = C(T); c.lineWidth = 2;
        for (var j = 0; j < 5; j++) {
          var xx = x - 18 + j * 9, off = 6 * Math.sin(gira + j);
          c.beginPath(); c.moveTo(xx, yM - 10 + off * 0.3); c.lineTo(xx, yM + 10 - off * 0.3); c.stroke();
        }
        c.fillStyle = cor; c.font = fonte(10.5, '700'); c.textBaseline = 'middle';
        c.textAlign = x < X0 + W * 0.35 ? 'right' : 'left';
        c.fillText(nome, x + (x < X0 + W * 0.35 ? -32 : 32), yM + Math.max(larg1, larg2) + 10);
      }
      maquina(xC, 26, 14, 'Compressor', (r.T1 + r.T2) / 2, ang);
      maquina(xTb, 14, 26, 'Turbina', (r.T3r + r.T4) / 2, ang);
      /* motor no compressor */
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
      c.fillRect(xC + 40, yM - 14, 34, 28); c.strokeRect(xC + 40, yM - 14, 34, 28);
      c.beginPath(); c.moveTo(xC + 26, yM); c.lineTo(xC + 40, yM); c.stroke();
      c.fillStyle = Plot.serie(3); c.font = fonte(10.5, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('W = ' + sg(r.W, 3) + ' kW', xC + 57, yM - 18);

      /* trocador quente (topo) e frio (base) */
      var hq = { x: xTb + 10, y: yT - 14, w: xC - xTb - 20, h: 28 };
      var hf = { x: xTb + 10, y: yB - 14, w: xC - xTb - 20, h: 28 };
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.fillRect(hq.x, hq.y, hq.w, hq.h); c.strokeRect(hq.x, hq.y, hq.w, hq.h);
      c.fillRect(hf.x, hf.y, hf.w, hf.h); c.strokeRect(hf.x, hf.y, hf.w, hf.h);
      var rotHX = function () {
        c.font = fonte(10, '700'); c.textAlign = 'center'; c.textBaseline = 'middle';
        [['rejeita calor ao ambiente', hq], ['absorve calor do espaço frio', hf]].forEach(function (q) {
          var wt = c.measureText(q[0]).width + 10;
          c.fillStyle = elev; c.fillRect(q[1].x + q[1].w / 2 - wt / 2, q[1].y + 5, wt, q[1].h - 10);
          c.fillStyle = cor; c.fillText(q[0], q[1].x + q[1].w / 2, q[1].y + q[1].h / 2);
        });
      };
      var fq = 1 + 0.15 * Math.sin(t * 5);
      for (k = 0; k < 3; k++) {
        var xq = hq.x + hq.w * (0.25 + 0.25 * k);
        seta(c, xq, hq.y - 4, xq, hq.y - 4 - 18 * fq, 'rgb(230,90,50)', 3, 8);
        seta(c, xq, hf.y + hf.h + 22 + 18 * fq, xq, hf.y + hf.h + 4, 'rgb(60,140,230)', 3, 8);
      }
      c.fillStyle = 'rgb(60,140,230)'; c.font = fonte(11, '700'); c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('Q_L = ' + sg(r.QL, 3) + ' kW', hf.x + hf.w + 8, hf.y + hf.h + 20);

      /* escoamento do ar: 1 (entra no compressor) → 2 → trocador quente → 3 → turbina → 4 → trocador frio → 1 */
      var cam = [[xC, hf.y + hf.h / 2], [xC + 0.001, yM + 26], [xC, yM - 14], [xC, hq.y + hq.h / 2],
                 [xTb, hq.y + hq.h / 2], [xTb, yM - 26], [xTb, yM + 26], [xTb, hf.y + hf.h / 2], [xC, hf.y + hf.h / 2]];
      /* desenhados em volta dos trocadores */
      tubo(c, [[xC, yM + 26], [xC, hf.y + hf.h + 2]], C(r.T1), 5);
      tubo(c, [[xC, yM - 14], [xC, hq.y + hq.h]], C(r.T2), 5);
      tubo(c, [[xTb, hq.y + hq.h], [xTb, yM - 26]], C(r.T3r), 5);
      tubo(c, [[xTb, yM + 26], [xTb, hf.y]], C(r.T4), 5);
      var n = 30;
      for (k = 0; k < n; k++) {
        var s = (t * 0.12 + k / n) % 1, pt = naPolilinha(cam, s), T;
        if (s < 0.15) T = r.T1; else if (s < 0.25) T = r.T1 + (r.T2 - r.T1) * (s - 0.15) / 0.10;
        else if (s < 0.40) T = r.T2; else if (s < 0.60) T = r.T2 + (r.T3r - r.T2) * (s - 0.40) / 0.20;
        else if (s < 0.70) T = r.T3r + (r.T4 - r.T3r) * (s - 0.60) / 0.10; else T = r.T4 + (r.T1 - r.T4) * (s - 0.70) / 0.30;
        c.fillStyle = C(T); c.beginPath(); c.arc(pt[0], pt[1], 2.8, 0, TAU); c.fill();
      }
      rotHX();
      [['1', xC, yB - 30, r.T1], ['2', xC, yT + 30, r.T2], ['3', xTb, yT + 30, r.T3r], ['4', xTb, yB - 30, r.T4]].forEach(function (e) {
        c.fillStyle = Plot.serie(6); c.beginPath(); c.arc(e[1], e[2], 9, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.font = fonte(10, '700'); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(e[0], e[1], e[2]);
        c.fillStyle = cor; c.font = fonte(10); c.textAlign = e[1] === xC ? 'left' : 'right';
        c.fillText(sg(e[3] - 273.15, 3) + ' °C', e[1] + (e[1] === xC ? 13 : -13), e[2]);
      });
      if (p.regen) {
        c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillText('com regenerador: o ar de retorno pré-resfria o ar antes da turbina', X0 + 4, Y0 + 2);
      }

      var lx = X0 + W * 0.78, ly = Y0 + 10;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12, '700'); c.fillText('Ciclo a ar', lx, ly);
      c.font = fonte(9.5); c.fillStyle = faint; c.fillText('Brayton reverso', lx, ly + 16);
      [['razão de pressão', sg(p.rp, 3)], ['COP_R', sg(r.copR, 3)], ['COP ideal', sg(r.copIdeal, 3)],
       ['turbina devolve', sg(100 * r.wt / r.wc, 3) + ' % de W_c']].forEach(function (ln, j) {
        c.fillStyle = faint; c.font = fonte(9.5); c.fillText(ln[0], lx, ly + 40 + j * 30);
        c.fillStyle = cor; c.font = fonte(11, '700'); c.fillText(ln[1], lx, ly + 52 + j * 30);
      });
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('maq');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-refrigeracao-ar', {
      titulo: 'Refrigeração a gás — o ciclo Brayton invertido',
      descricao: 'Em vez de evaporar um líquido, comprime-se ar, resfria-se o ar comprimido até perto da temperatura ambiente e expande-se numa turbina: ele sai muito frio. É menos eficiente que a compressão de vapor, mas é leve e usa o próprio ar — é o que refrigera a cabine dos aviões.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Ciclo ideal, razão 4', desc: 'COP = 1/(4^0,286 − 1) = 2,06', valores: { T1: -18, T3: 27, rp: 4, etaC: 100, etaT: 100, m: 0.1, regen: false, animar: true } },
        { nome: '2 · Máquinas reais', desc: 'η = 80 % em compressor e turbina', valores: { T1: -18, T3: 27, rp: 4, etaC: 80, etaT: 85, m: 0.1, regen: false, animar: true } },
        { nome: '3 · Cabine de avião', desc: 'Ar sangrado do motor, razão 3', valores: { T1: 15, T3: 45, rp: 3, etaC: 80, etaT: 85, m: 1.0, regen: false, animar: true } },
        { nome: '4 · Temperatura muito baixa', desc: 'Regenerador para chegar a −80 °C', valores: { T1: -40, T3: 30, rp: 5, etaC: 85, etaT: 88, m: 0.1, regen: true, animar: true } }
      ],
      controles: [
        { id: 'T1', label: 'Ar na entrada do compressor (espaço frio)', min: -60, max: 20, step: 1, valor: -18, unidade: '°C' },
        { id: 'T3', label: 'Ar após o trocador quente', min: 10, max: 60, step: 1, valor: 27, unidade: '°C' },
        { id: 'rp', label: 'Razão de pressão', min: 1.5, max: 8, step: 0.1, valor: 4, unidade: '' },
        { id: 'etaC', label: 'Eficiência do compressor', min: 50, max: 100, step: 1, valor: 100, unidade: '%' },
        { id: 'etaT', label: 'Eficiência da turbina', min: 50, max: 100, step: 1, valor: 100, unidade: '%' },
        { id: 'm', label: 'Vazão de ar', min: 0.01, max: 2, step: 0.01, valor: 0.1, unidade: 'kg/s' },
        { id: 'regen', tipo: 'check', label: 'Com regenerador', valor: false },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'maq', axes: false, height: 360, grid: false, legend: false },
        { id: 'ts', titulo: 'Diagrama T-s', xlabel: 's − s₁ (kJ/kg·K)', ylabel: 'Temperatura (°C)', aspect: 0.48, legendPos: 'topleft' },
        { id: 'coprp', titulo: 'COP contra a razão de pressão', xlabel: 'Razão de pressão', ylabel: 'COP_R', aspect: 0.40, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'T2', label: 'Saída do compressor' },
        { id: 'T4', label: 'Saída da turbina (ar frio)' },
        { id: 'QL', label: 'Refrigeração' },
        { id: 'W', label: 'Potência líquida' },
        { id: 'cop', label: 'COP_R' }
      ],
      formulas: [
        { tex: '\\frac{T_2}{T_1} = \\frac{T_3}{T_4} = r_p^{(k-1)/k}', d: 'processos isentrópicos de gás ideal', destaque: true },
        { tex: 'q_L = c_p (T_1 - T_4) \\qquad w = c_p(T_2 - T_1) - c_p(T_3 - T_4)' },
        { tex: 'COP_{R,ideal} = \\frac{1}{r_p^{(k-1)/k} - 1}', d: 'só depende da razão de pressão', destaque: true },
        { tex: 'T_2 = T_1 + \\frac{T_{2s} - T_1}{\\eta_c} \\qquad T_4 = T_3 - \\eta_t (T_3 - T_{4s})', d: 'máquinas reais' }
      ],
      passos: [],
      nota: 'Ar como gás ideal com c_p = 1,005 kJ/kg·K e k = 1,4 constantes. O regenerador é tratado como ideal: leva o ar que entra na turbina à temperatura do ar que sai do espaço frio.',
      calcular: function (p, ctx) {
        var r = TD2.cicloAr(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();
        var R = 0.287, cp = r.cp;
        function sRel(T, P) { return cp * Math.log(T / r.T1) - R * Math.log(P); }
        var g = ctx.plot('ts').clear();
        var P1 = 1, P2 = p.rp;
        var cx = [sRel(r.T1, P1), sRel(r.T2, P2)];
        g.line(cx, [r.T1 - 273.15, r.T2 - 273.15], { color: Plot.serie(3), width: 2.8, label: 'compressão 1→2' });
        var Ts = Plot.linspace(r.T3r, r.T2, 20);
        g.line(Ts.map(function (T) { return sRel(T, P2); }).reverse(), Ts.map(function (T) { return T - 273.15; }).reverse(), { color: 'rgb(230,90,50)', width: 2.8, label: 'rejeição de calor 2→3' });
        g.line([sRel(r.T3r, P2), sRel(r.T4, P1)], [r.T3r - 273.15, r.T4 - 273.15], { color: Plot.serie(5), width: 2.8, label: 'expansão 3→4' });
        var Tf = Plot.linspace(r.T4, r.T1, 20);
        g.line(Tf.map(function (T) { return sRel(T, P1); }), Tf.map(function (T) { return T - 273.15; }), { color: 'rgb(60,140,230)', width: 2.8, label: 'refrigeração 4→1' });
        [['1', r.T1, P1], ['2', r.T2, P2], ['3', r.T3r, P2], ['4', r.T4, P1]].forEach(function (q) { g.marker(sRel(q[1], q[2]), q[1] - 273.15, q[0], { color: Plot.serie(6), r: 4.5 }); });
        g.draw();

        var rps = Plot.linspace(1.5, 8, 60);
        var gc = ctx.plot('coprp').clear();
        gc.line(rps, rps.map(function (x) { return TD2.cicloAr(Object.assign({}, p, { rp: x, etaC: 100, etaT: 100 })).copR; }), { color: Plot.serie(2), width: 2, dash: [5, 3], label: 'ideal' });
        gc.line(rps, rps.map(function (x) { var q = TD2.cicloAr(Object.assign({}, p, { rp: x })); return q.w > 0 && q.qL > 0 ? q.copR : NaN; }), { color: Plot.serie(0), width: 2.6, label: 'com as eficiências escolhidas' });
        gc.marker(p.rp, r.copR, 'operação', { color: Plot.serie(6), r: 5 });
        gc.setLimits([1.5, 8], [0, 6]);
        gc.draw();

        ctx.setPassos([
          { t: '① Compressão',
            tex: 'T_{2s} = T_1\\,r_p^{(k-1)/k}, \\quad T_2 = T_1 + \\frac{T_{2s} - T_1}{\\eta_c}',
            texSub: 'T_{2s} = ' + nt(r.T1, 4) + '\\times' + nt(p.rp) + '^{0{,}2857} = ' + nt(r.T2s, 4) + '\\ K \\;\\Rightarrow\\; T_2 = ' + nt(r.T2, 4) + '\\ K',
            obs: 'O ar sai quente do compressor e é resfriado pelo ambiente até T₃. É por isso que o ciclo só funciona se T₂ ficar acima da temperatura do ambiente.' },
          { t: '② Expansão na turbina',
            tex: 'T_{4s} = \\frac{T_3}{r_p^{(k-1)/k}}, \\quad T_4 = T_3 - \\eta_t(T_3 - T_{4s})',
            texSub: 'T_{4s} = \\frac{' + nt(r.T3r, 4) + '}{' + nt(Math.pow(p.rp, 0.2857), 4) + '} = ' + nt(r.T4s, 4) + '\\ K \\;\\Rightarrow\\; T_4 = ' + nt(r.T4, 4) + '\\ K = ' + nt(r.T4 - 273.15, 3) + '\\,{}^\\circ C',
            obs: 'É a turbina que produz o frio: o ar entra à temperatura ambiente e sai ' + sg(r.T3r - r.T4, 3) + ' K mais frio. Uma válvula não faria isso — num gás ideal, estrangulamento não muda a temperatura.' },
          { t: '③ Balanço e COP',
            tex: 'q_L = c_p(T_1 - T_4), \\quad w = c_p[(T_2 - T_1) - (T_3 - T_4)], \\quad COP = q_L/w',
            texSub: 'q_L = ' + nt(r.qL, 4) + ',\\ w = ' + nt(r.wc, 4) + ' - ' + nt(r.wt, 4) + ' = ' + nt(r.w, 4) + '\\ kJ/kg \\;\\Rightarrow\\; COP = ' + nt(r.copR, 3),
            obs: 'A turbina devolve ' + sg(100 * r.wt / r.wc, 3) + ' % do trabalho do compressor pelo eixo. Com máquinas reais, as perdas incidem sobre dois trabalhos grandes cuja diferença é pequena — o COP cai muito mais depressa que no ciclo a vapor.' }
        ]);
        return {
          T2: { v: r.T2 - 273.15, u: '°C' },
          T4: { v: r.T4 - 273.15, u: '°C' },
          QL: { v: r.QL, u: 'kW' },
          W: { v: r.W, u: 'kW' },
          cop: { v: r.copR, u: '', classe: r.copR > 0 ? 'destaque' : 'alerta' }
        };
      }
    });
  })();

  /* ==========================================================================
     3. Psicrometria
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-psicrometria')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, t = A.t, k;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var y0 = Y0 + H * 0.30, y1 = Y0 + H * 0.70, xa = X0 + W * 0.02, xb = X0 + W * 0.74;
      var xm = X0 + W * 0.30, xn = X0 + W * 0.46;          /* equipamento */
      var T1 = r.s1.T, T2 = r.s2.T, Tmin = Math.min(T1, T2) - 3, Tmax = Math.max(T1, T2) + 3;

      /* duto */
      c.fillStyle = 'rgba(150,150,150,0.10)'; c.fillRect(xa, y0, xb - xa, y1 - y0);
      c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath(); c.moveTo(xa, y0); c.lineTo(xb, y0); c.moveTo(xa, y1); c.lineTo(xb, y1); c.stroke();
      if (p.proc === 'mistura') {
        /* segundo duto entrando por cima */
        c.fillStyle = 'rgba(150,150,150,0.10)'; c.fillRect(xm - 4, Y0 + 4, xn - xm + 8, y0 - Y0 - 4);
        c.beginPath(); c.moveTo(xm - 4, Y0 + 4); c.lineTo(xm - 4, y0); c.moveTo(xn + 4, Y0 + 4); c.lineTo(xn + 4, y0); c.stroke();
      }
      /* equipamento */
      if (p.proc === 'aquecimento') {
        c.strokeStyle = 'rgb(230,90,50)'; c.lineWidth = 2.5;
        for (k = 0; k < 4; k++) { c.beginPath(); for (var j = 0; j <= 12; j++) { var yy = y0 + 6 + (y1 - y0 - 12) * j / 12; var xx = xm + 12 + k * 14 + (j % 2 ? 5 : -5); if (j) c.lineTo(xx, yy); else c.moveTo(xx, yy); } c.stroke(); }
        c.fillStyle = 'rgb(230,90,50)'; c.font = fonte(10, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText('resistência · Q = ' + sg(r.Q / 60, 3) + ' kW', (xm + xn) / 2, y0 - 4);
      } else if (p.proc === 'resfriamento') {
        c.strokeStyle = 'rgb(60,140,230)'; c.lineWidth = 2.5;
        for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(xm + 12 + k * 14, y0 + 4); c.lineTo(xm + 12 + k * 14, y1 - 4); c.stroke(); }
        c.fillStyle = 'rgb(60,140,230)'; c.font = fonte(10, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText('serpentina fria · Q = ' + sg(r.Q / 60, 3) + ' kW', (xm + xn) / 2, y0 - 4);
        /* gotas de condensado caindo */
        if (r.mw > 1e-6) {
          for (k = 0; k < 8; k++) {
            var fd = (t * 0.8 + k / 8) % 1;
            c.fillStyle = 'rgb(60,140,230)';
            c.beginPath(); c.arc(xm + 14 + (k % 4) * 14, y1 + 4 + fd * 34, 2.4, 0, TAU); c.fill();
          }
          c.textBaseline = 'top'; c.fillText('condensado ' + sg(r.mw * 60, 3) + ' kg/h', (xm + xn) / 2, y1 + 40);
        }
      } else if (p.proc === 'evaporativo') {
        c.fillStyle = 'rgba(60,140,230,0.25)'; c.fillRect(xm + 6, y0 + 3, xn - xm - 12, y1 - y0 - 6);
        for (k = 0; k < 10; k++) {
          var fe = (t * 0.6 + k / 10) % 1;
          c.fillStyle = 'rgb(60,140,230)';
          c.beginPath(); c.arc(xm + 10 + (k * 7) % (xn - xm - 20), y0 + 4 + fe * (y1 - y0 - 8), 1.8, 0, TAU); c.fill();
        }
        c.fillStyle = 'rgb(60,140,230)'; c.font = fonte(10, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText('meio poroso molhado · +' + sg(r.mw * 60, 3) + ' kg/h de água', (xm + xn) / 2, y0 - 4);
      } else {
        c.fillStyle = faint; c.font = fonte(10, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText('câmara de mistura adiabática', (xm + xn) / 2, y0 - 4);
      }
      /* partículas de ar, coloridas pela temperatura */
      var n = 40;
      for (k = 0; k < n; k++) {
        var s = (t * 0.08 + k / n) % 1, x = xa + s * (xb - xa);
        var yv = y0 + 6 + ((k * 0.618) % 1) * (y1 - y0 - 12);
        var Tk = x < xm ? T1 : (x > xn ? T2 : T1 + (T2 - T1) * (x - xm) / (xn - xm));
        c.fillStyle = corTemp(Tk, Tmin, Tmax);
        c.beginPath(); c.arc(x, yv, 2.6, 0, TAU); c.fill();
        /* vapor d'água: pontos azuis, na proporção de ω */
        var wk = x < xm ? r.s1.w : r.s2.w;
        if (((k * 0.382) % 1) < wk * 30) {
          c.fillStyle = 'rgba(40,110,220,0.8)';
          c.beginPath(); c.arc(x + 4, yv - 3, 1.5, 0, TAU); c.fill();
        }
      }
      if (p.proc === 'mistura') {
        for (k = 0; k < 12; k++) {
          var sm = (t * 0.10 + k / 12) % 1, ym = Y0 + 6 + sm * (y0 - Y0);
          c.fillStyle = corTemp(r.s3.T, Math.min(Tmin, r.s3.T - 3), Math.max(Tmax, r.s3.T + 3));
          c.beginPath(); c.arc(xm + 6 + ((k * 0.618) % 1) * (xn - xm - 12), ym, 2.6, 0, TAU); c.fill();
        }
      }
      /* estados */
      function cartao(x, y, nome, s, al) {
        c.textAlign = al || 'left'; c.textBaseline = 'top';
        c.fillStyle = cor; c.font = fonte(11, '700'); c.fillText(nome, x, y);
        c.font = fonte(9.5); c.fillStyle = faint;
        c.fillText(sg(s.T, 3) + ' °C · φ ' + sg(100 * s.phi, 3) + ' %', x, y + 15);
        c.fillText('ω ' + sg(1000 * s.w, 3) + ' g/kg · h ' + sg(s.h, 3), x, y + 28);
      }
      cartao(xa + 4, y1 + 8, 'Entrada 1', r.s1);
      cartao(xb - 4, y1 + 8, p.proc === 'mistura' ? 'Mistura 3' : 'Saída 2', r.s2, 'right');
      if (p.proc === 'mistura') cartao(xn + 12, Y0 + 4, 'Fluxo 2', r.s3);

      var lx = X0 + W * 0.78, ly = Y0 + 6;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12, '700'); c.fillText('Ar de entrada', lx, ly);
      [['bulbo úmido', sg(r.s1.Twb, 3) + ' °C'], ['ponto de orvalho', sg(r.s1.Tdp, 3) + ' °C'],
       ['pressão de vapor', sg(r.s1.Pv, 3) + ' kPa'], ['volume específico', sg(r.s1.v, 3) + ' m³/kg ar seco'],
       ['vazão de ar seco', sg(r.ma, 3) + ' kg/min']].forEach(function (ln, j) {
        c.fillStyle = faint; c.font = fonte(9.5); c.fillText(ln[0], lx, ly + 22 + j * 29);
        c.fillStyle = cor; c.font = fonte(11, '700'); c.fillText(ln[1], lx, ly + 34 + j * 29);
      });
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('duto');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-psicrometria', {
      titulo: 'Psicrometria — carta interativa e processos de ar-condicionado',
      descricao: 'O ar atmosférico é uma mistura de ar seco e vapor d’água. Escolha um processo e veja o ponto andar na carta psicrométrica: aquecer não muda a umidade absoluta, resfriar abaixo do orvalho condensa água, o resfriador evaporativo segue a linha de bulbo úmido.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Ar-condicionado de janela', desc: 'Çengel Ex. 14-6: 30 °C 80 % → 14 °C saturado', valores: { proc: 'resfriamento', P: 101.325, T1: 30, phi1: 80, V1: 10, T2: 14, phi2: 100, T3: 32, phi3: 60, V3: 20, animar: true } },
        { nome: '2 · Mistura de dois fluxos', desc: 'Çengel Ex. 14-7: 14 °C sat + 32 °C 60 %', valores: { proc: 'mistura', P: 101.325, T1: 14, phi1: 100, V1: 50, T2: 20, phi2: 50, T3: 32, phi3: 60, V3: 20, animar: true } },
        { nome: '3 · Aquecimento no inverno', desc: 'A umidade relativa despenca', valores: { proc: 'aquecimento', P: 101.325, T1: 10, phi1: 70, V1: 20, T2: 24, phi2: 50, T3: 32, phi3: 60, V3: 20, animar: true } },
        { nome: '4 · Resfriador evaporativo no sertão', desc: '35 °C e 20 % → 80 %', valores: { proc: 'evaporativo', P: 101.325, T1: 35, phi1: 20, V1: 20, T2: 20, phi2: 80, T3: 32, phi3: 60, V3: 20, animar: true } },
        { nome: '5 · Mesmo ar em Brasília', desc: 'P = 89 kPa (1 170 m de altitude)', valores: { proc: 'resfriamento', P: 89, T1: 30, phi1: 80, V1: 10, T2: 14, phi2: 100, T3: 32, phi3: 60, V3: 20, animar: true } }
      ],
      controles: [
        { id: 'proc', tipo: 'select', label: 'Processo', valor: 'resfriamento',
          opcoes: [{ v: 'aquecimento', t: 'Aquecimento simples' }, { v: 'resfriamento', t: 'Resfriamento com desumidificação' },
                   { v: 'evaporativo', t: 'Resfriamento evaporativo' }, { v: 'mistura', t: 'Mistura adiabática de dois fluxos' }] },
        { id: 'P', label: 'Pressão atmosférica', min: 70, max: 101.325, step: 0.1, valor: 101.325, unidade: 'kPa' },
        { tipo: 'titulo', label: 'Ar de entrada (1)' },
        { id: 'T1', label: 'Temperatura de bulbo seco', min: 0, max: 45, step: 0.5, valor: 30, unidade: '°C' },
        { id: 'phi1', label: 'Umidade relativa', min: 5, max: 100, step: 1, valor: 80, unidade: '%' },
        { id: 'V1', label: 'Vazão volumétrica', min: 1, max: 100, step: 1, valor: 10, unidade: 'm³/min' },
        { tipo: 'titulo', label: 'Saída (2) — aquecimento, resfriamento, evaporativo' },
        { id: 'T2', label: 'Temperatura de saída', min: 2, max: 50, step: 0.5, valor: 14, unidade: '°C', desc: 'usada no aquecimento e no resfriamento' },
        { id: 'phi2', label: 'Umidade relativa de saída', min: 20, max: 100, step: 1, valor: 100, unidade: '%', desc: 'usada no resfriamento e no evaporativo' },
        { tipo: 'titulo', label: 'Segundo fluxo — só na mistura' },
        { id: 'T3', label: 'Temperatura', min: 0, max: 45, step: 0.5, valor: 32, unidade: '°C' },
        { id: 'phi3', label: 'Umidade relativa', min: 5, max: 100, step: 1, valor: 60, unidade: '%' },
        { id: 'V3', label: 'Vazão volumétrica', min: 1, max: 100, step: 1, valor: 20, unidade: 'm³/min' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'duto', axes: false, height: 300, grid: false, legend: false },
        { id: 'carta', titulo: 'Carta psicrométrica', xlabel: 'Temperatura de bulbo seco (°C)', ylabel: 'Umidade absoluta ω (g/kg de ar seco)',
          aspect: 0.62, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'w1', label: 'ω de entrada' },
        { id: 'h1', label: 'h de entrada' },
        { id: 'Twb', label: 'Bulbo úmido' },
        { id: 'Tdp', label: 'Ponto de orvalho' },
        { id: 's2', label: 'Estado de saída' },
        { id: 'Q', label: 'Calor trocado' },
        { id: 'mw', label: 'Água condensada / adicionada' }
      ],
      formulas: [
        { g: 'Propriedades do ar úmido' },
        { tex: '\\omega = \\frac{m_v}{m_a} = \\frac{0{,}622\\,P_v}{P - P_v}', d: 'umidade absoluta (específica)', destaque: true },
        { tex: '\\phi = \\frac{P_v}{P_g(T)} = \\frac{\\omega P}{(0{,}622 + \\omega) P_g}', d: 'umidade relativa', destaque: true },
        { tex: 'h = 1{,}005\\,T + \\omega\\,(2501{,}3 + 1{,}82\\,T)', d: 'kJ/kg de ar seco' },
        { tex: 'v = \\frac{R_a T}{P - P_v}', d: 'm³/kg de ar seco' },
        { tex: 'T_{orv} = T_{sat}(P_v)', d: 'temperatura em que o vapor começa a condensar' },
        { g: 'Saturação adiabática (bulbo úmido)' },
        { tex: '\\omega_1 = \\frac{c_p (T_2 - T_1) + \\omega_2 h_{fg,2}}{h_{g,1} - h_{f,2}}', d: 'T₂ = temperatura de saturação adiabática ≈ bulbo úmido', destaque: true },
        { g: 'Balanços nos processos' },
        { tex: '\\dot m_a \\omega_1 = \\dot m_a \\omega_2 + \\dot m_w', d: 'massa de água' },
        { tex: '\\dot Q = \\dot m_a (h_1 - h_2) - \\dot m_w h_w', d: 'energia na serpentina de resfriamento' },
        { tex: '\\frac{\\dot m_{a1}}{\\dot m_{a2}} = \\frac{\\omega_2 - \\omega_3}{\\omega_3 - \\omega_1} = \\frac{h_2 - h_3}{h_3 - h_1}', d: 'mistura adiabática: o estado 3 fica sobre a reta 1–2' }
      ],
      passos: [],
      nota: 'Ar seco e vapor como gases ideais; P_sat da água pela tabela A-4 (Çengel), interpolada em ln P. Conferido contra os exemplos 14-4, 14-6 e 14-7 do Çengel com desvio abaixo de 0,5 %.',
      calcular: function (p, ctx) {
        var r = TD2.processo(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();

        var g = ctx.plot('carta').clear();
        var Ts = Plot.linspace(0, 50, 101);
        [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (ph) {
          g.line(Ts, Ts.map(function (T) { var w = TD2.w(T, ph / 100, p.P); return w < 0.032 ? 1000 * w : NaN; }),
                 { color: ph === 100 ? Plot.serie(0) : Plot.cssVar('--text-faint', '#aaa'), width: ph === 100 ? 2.4 : 1, label: ph === 100 ? 'saturação (φ = 100 %)' : undefined });
          if (ph % 20 === 0 && ph < 100) {
            var Tl = 44, wl = TD2.w(Tl, ph / 100, p.P);
            if (wl < 0.031) g.text(Tl, 1000 * wl, ph + ' %', { size: 9, color: Plot.cssVar('--text-faint', '#999'), dy: -2 });
          }
        });
        [20, 40, 60, 80, 100].forEach(function (hh) {
          var xs = [], ys = [];
          Ts.forEach(function (T) { var w = (hh - 1.005 * T) / (2501.3 + 1.82 * T); if (w >= 0 && w <= TD2.w(T, 1, p.P)) { xs.push(T); ys.push(1000 * w); } });
          if (xs.length > 1) g.line(xs, ys, { color: Plot.serie(4), width: 0.9, dash: [3, 4] });
          if (xs.length) g.text(xs[0], ys[0], 'h=' + hh, { size: 9, color: Plot.serie(4), align: 'right', dx: -3 });
        });
        var s1 = r.s1, s2 = r.s2;
        if (p.proc === 'resfriamento' && s1.w > s2.w + 1e-6) {
          /* caminho típico: resfria a ω constante até o orvalho, depois segue a saturação */
          var cx = [s1.T, s1.Tdp], cy = [1000 * s1.w, 1000 * s1.w];
          for (var T = s1.Tdp; T >= s2.T; T -= 0.5) { cx.push(T); cy.push(1000 * Math.min(s1.w, TD2.w(T, 1, p.P))); }
          cx.push(s2.T); cy.push(1000 * s2.w);
          g.line(cx, cy, { color: Plot.serie(6), width: 2.8, label: 'caminho do processo' });
        } else if (p.proc === 'mistura') {
          g.line([s1.T, r.s3.T], [1000 * s1.w, 1000 * r.s3.w], { color: Plot.serie(6), width: 2.2, dash: [5, 3], label: 'reta de mistura' });
          g.marker(r.s3.T, 1000 * r.s3.w, '2', { color: Plot.serie(3), r: 5 });
        } else {
          g.line([s1.T, s2.T], [1000 * s1.w, 1000 * s2.w], { color: Plot.serie(6), width: 2.8, label: 'caminho do processo' });
        }
        g.marker(s1.T, 1000 * s1.w, '1', { color: Plot.serie(3), r: 5.5 });
        g.marker(s2.T, 1000 * s2.w, p.proc === 'mistura' ? '3' : '2', { color: Plot.serie(2), r: 5.5 });
        g.marker(s1.Tdp, 1000 * s1.w, 'orvalho', { color: Plot.serie(0), r: 3.5 });
        g.setLimits([0, 50], [0, 30]);
        g.draw();

        var passos = [];
        passos.push({ t: '① Estado de entrada',
          tex: 'P_v = \\phi P_g(T),\\quad \\omega = \\frac{0{,}622 P_v}{P - P_v},\\quad h = 1{,}005T + \\omega(2501{,}3 + 1{,}82T)',
          texSub: 'P_g(' + nt(p.T1) + ') = ' + nt(s1.Pg, 4) + ',\\ P_v = ' + nt(s1.Pv, 4) + '\\ kPa \\;\\Rightarrow\\; \\omega_1 = ' + nt(s1.w, 4) + ',\\ h_1 = ' + nt(s1.h, 4) + '\\ kJ/kg',
          obs: 'Tudo é por kg de AR SECO, porque é a massa que não muda ao longo do processo — a de vapor muda quando se condensa ou evapora água.' });
        passos.push({ t: '② Vazão de ar seco',
          tex: 'v = \\frac{R_a T}{P - P_v}, \\qquad \\dot m_a = \\frac{\\dot V}{v}',
          texSub: 'v_1 = \\frac{0{,}287\\times' + nt(p.T1 + 273.15, 4) + '}{' + nt(p.P, 4) + ' - ' + nt(s1.Pv, 4) + '} = ' + nt(s1.v, 4) + '\\ m^3/kg \\;\\Rightarrow\\; \\dot m_a = ' + nt(r.ma, 4) + '\\ kg/min',
          obs: 'Em altitude a pressão cai, o volume específico sobe e, para a mesma vazão do ventilador, passa menos massa de ar — o equipamento rende menos.' });
        if (p.proc === 'aquecimento') {
          passos.push({ t: '③ Aquecimento: ω constante',
            tex: '\\omega_2 = \\omega_1,\\quad \\dot Q = \\dot m_a(h_2 - h_1)',
            texSub: 'h_2 = ' + nt(s2.h, 4) + ' \\;\\Rightarrow\\; \\dot Q = ' + nt(r.ma, 4) + '(' + nt(s2.h, 4) + ' - ' + nt(s1.h, 4) + ') = ' + nt(r.Q, 4) + '\\ kJ/min = ' + nt(r.Q / 60, 3) + '\\ kW',
            obs: 'A umidade relativa cai de ' + sg(100 * s1.phi, 3) + ' % para ' + sg(100 * s2.phi, 3) + ' % sem sair nem entrar uma gota de água. É por isso que aquecimento no inverno resseca o ar — e se instala umidificação junto.' });
        } else if (p.proc === 'resfriamento') {
          passos.push({ t: '③ Resfriamento com desumidificação',
            tex: '\\dot m_w = \\dot m_a(\\omega_1 - \\omega_2),\\quad \\dot Q = \\dot m_a(h_1 - h_2) - \\dot m_w h_w',
            texSub: '\\dot m_w = ' + nt(r.ma, 4) + '(' + nt(s1.w, 4) + ' - ' + nt(s2.w, 4) + ') = ' + nt(r.mw, 4) + '\\ kg/min,\\quad \\dot Q = ' + nt(r.Q, 4) + '\\ kJ/min = ' + nt(r.Q / 60, 3) + '\\ kW',
            obs: 'O ar só perde água depois de chegar ao ponto de orvalho (' + sg(s1.Tdp, 3) + ' °C). A maior parte do calor retirado é latente: condensar vapor custa muito mais energia que baixar a temperatura. Por isso o ar sai frio e quase saturado — e depois costuma ser reaquecido.' });
        } else if (p.proc === 'evaporativo') {
          passos.push({ t: '③ Resfriamento evaporativo: h ≈ constante',
            tex: 'h_2 \\approx h_1 \\;\\Rightarrow\\; T_2 \\text{ sobre a linha de bulbo úmido}',
            texSub: 'h_1 = ' + nt(s1.h, 4) + ' \\;\\Rightarrow\\; T_2 = ' + nt(s2.T, 3) + '\\,{}^\\circ C\\ (\\phi_2 = ' + nt(100 * s2.phi, 3) + '\\ \\%),\\ \\dot m_w = ' + nt(r.mw, 4) + '\\ kg/min',
            obs: 'O calor para evaporar a água sai do próprio ar, que esfria. O limite é o bulbo úmido (' + sg(s1.Twb, 3) + ' °C) — por isso funciona muito bem no clima seco e quase nada no úmido.' });
        } else {
          passos.push({ t: '③ Mistura adiabática',
            tex: '\\omega_3 = \\frac{\\dot m_1\\omega_1 + \\dot m_2\\omega_2}{\\dot m_1 + \\dot m_2},\\quad h_3 = \\frac{\\dot m_1 h_1 + \\dot m_2 h_2}{\\dot m_1 + \\dot m_2}',
            texSub: '\\dot m_2 = ' + nt(r.mb, 4) + '\\ kg/min \\;\\Rightarrow\\; \\omega_3 = ' + nt(s2.w, 4) + ',\\ h_3 = ' + nt(s2.h, 4) + ',\\ T_3 = ' + nt(s2.T, 3) + '\\,{}^\\circ C',
            obs: 'O estado da mistura fica sobre a reta que une os dois estados na carta, dividida na proporção inversa das vazões mássicas — mais perto do fluxo maior.' });
        }
        ctx.setPassos(passos);

        return {
          w1: { v: 1000 * s1.w, u: 'g/kg' },
          h1: { v: s1.h, u: 'kJ/kg' },
          Twb: { v: s1.Twb, u: '°C' },
          Tdp: { v: s1.Tdp, u: '°C' },
          s2: { v: sg(s2.T, 3) + ' °C · ' + sg(100 * s2.phi, 3) + ' %', u: '' },
          Q: { v: r.Q / 60, u: 'kW', classe: 'destaque' },
          mw: { v: r.mw * 60, u: 'kg/h' }
        };
      }
    });
  })();

  /* ==========================================================================
     4. Bocal convergente-divergente
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-bocal')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };
    var GASES = {
      ar: { nome: 'Ar', k: 1.4, R: 0.287 },
      co2: { nome: 'CO₂', k: 1.289, R: 0.1889 },
      he: { nome: 'Hélio', k: 1.667, R: 2.0769 },
      vapor: { nome: 'Vapor d’água superaquecido', k: 1.3, R: 0.4615 }
    };
    function corMach(M) {
      var f = Math.max(0, Math.min(1, M / 2.5));
      return 'rgb(' + Math.round(40 + 215 * f) + ',' + Math.round(140 - 60 * f + 60 * Math.sin(f * Math.PI)) + ',' + Math.round(230 - 200 * f) + ')';
    }

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, t = A.t, i, k;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var xa = X0 + W * 0.03, xb = X0 + W * 0.58, yc = Y0 + H * 0.46;
      var Amax = Math.max(p.Ai, p.Ae);
      var esc = (H * 0.30) / Math.sqrt(Amax);               /* meia-altura ∝ √A (bocal axissimétrico) */
      function meia(A) { return esc * Math.sqrt(A); }
      function X(x) { return xa + x * (xb - xa); }
      var per = r.perfil;

      /* corpo do bocal preenchido pela cor do Mach */
      for (i = 0; i < per.length - 1; i++) {
        var q = per[i], q2 = per[i + 1];
        c.fillStyle = corMach(q.M); c.globalAlpha = 0.45;
        c.fillRect(X(q.x), yc - meia(q.A), X(q2.x) - X(q.x) + 1, 2 * meia(q.A));
      }
      c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 2.6;
      [1, -1].forEach(function (sgn) {
        c.beginPath();
        per.forEach(function (q, j) { var y = yc - sgn * meia(q.A); if (j) c.lineTo(X(q.x), y); else c.moveTo(X(q.x), y); });
        c.stroke();
      });
      /* garganta */
      c.strokeStyle = faint; c.lineWidth = 1; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(X(r.xg), yc - meia(p.At) - 10); c.lineTo(X(r.xg), yc + meia(p.At) + 10); c.stroke(); c.setLineDash([]);
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('garganta', X(r.xg), yc - meia(p.At) - 12);

      /* partículas com a velocidade local */
      var Vmax = 1;
      per.forEach(function (q) { Vmax = Math.max(Vmax, q.V); });
      A.part = A.part || [];
      if (A.part.length !== 70) { A.part = []; for (k = 0; k < 70; k++) A.part.push({ x: Math.random(), f: Math.random() * 2 - 1 }); }
      A.part.forEach(function (pt) {
        var j = Math.min(per.length - 1, Math.floor(pt.x * (per.length - 1)));
        var q = per[j];
        var y = yc + pt.f * meia(q.A) * 0.85;
        c.fillStyle = corMach(q.M);
        c.beginPath(); c.arc(X(pt.x), y, 2.4, 0, TAU); c.fill();
      });

      /* choque normal */
      if (r.xShock !== null) {
        var xs = X(r.xShock), As = r.Ashock;
        c.strokeStyle = Plot.serie(6); c.lineWidth = 4;
        c.beginPath(); c.moveTo(xs, yc - meia(As)); c.lineTo(xs, yc + meia(As)); c.stroke();
        c.fillStyle = Plot.serie(6); c.font = fonte(11, '700'); c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText('choque normal', xs, yc + meia(As) + 6);
        c.font = fonte(9.5);
        c.fillText('Ma ' + sg(r.choqueInfo.M1, 3) + ' → ' + sg(r.choqueInfo.c.M2, 3), xs, yc + meia(As) + 20);
      }
      /* jato fora do bocal */
      var ye = meia(p.Ae), xe = X(1);
      if (/sobre-expandido/.test(r.regime)) {
        c.strokeStyle = Plot.serie(6); c.lineWidth = 1.6;
        for (k = 0; k < 3; k++) {
          var x0 = xe + k * 20, h0 = ye * (1 - 0.12 * k);
          c.beginPath(); c.moveTo(x0, yc - h0); c.lineTo(x0 + 10, yc); c.lineTo(x0, yc + h0);
          c.moveTo(x0 + 10, yc); c.lineTo(x0 + 20, yc - h0 * 0.9); c.moveTo(x0 + 10, yc); c.lineTo(x0 + 20, yc + h0 * 0.9); c.stroke();
        }
      } else if (/subexpandido/.test(r.regime)) {
        c.strokeStyle = Plot.serie(0); c.lineWidth = 1.2;
        for (k = 0; k < 6; k++) {
          var ang = (k - 2.5) * 0.12;
          c.beginPath(); c.moveTo(xe, yc - ye); c.lineTo(xe + 40 * Math.cos(-0.4 + ang), yc - ye - 40 * Math.sin(0.4 + ang) * 0.6); c.stroke();
          c.beginPath(); c.moveTo(xe, yc + ye); c.lineTo(xe + 40 * Math.cos(-0.4 + ang), yc + ye + 40 * Math.sin(0.4 + ang) * 0.6); c.stroke();
        }
      } else {
        c.fillStyle = corMach(per[per.length - 1].M); c.globalAlpha = 0.25;
        c.fillRect(xe, yc - ye, 45, 2 * ye); c.globalAlpha = 1;
      }
      c.fillStyle = faint; c.font = fonte(10); c.textAlign = 'left'; c.textBaseline = 'middle';
      c.textBaseline = 'top'; c.fillText('P_b = ' + sg(p.Pb, 4) + ' kPa', xe + 2, yc + ye + 8); c.textBaseline = 'middle';
      c.fillText('reservatório: P₀ ' + sg(p.P0, 4) + ' kPa · T₀ ' + sg(p.T0, 4) + ' K', xa, Y0 + 8);

      /* régua de cor */
      var rx = X0 + W * 0.04, ry = Y0 + H * 0.92, rw = W * 0.40;
      for (k = 0; k < 50; k++) { c.fillStyle = corMach(2.5 * k / 50); c.fillRect(rx + rw * k / 50, ry, rw / 50 + 1, 8); }
      c.fillStyle = faint; c.font = fonte(9); c.textAlign = 'center'; c.textBaseline = 'top';
      [0, 0.5, 1, 1.5, 2, 2.5].forEach(function (m) { c.fillText('Ma ' + m, rx + rw * m / 2.5, ry + 10); });

      /* painel */
      var lx = X0 + W * 0.73, ly = Y0 + 6, e = per[per.length - 1];
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12, '700'); c.fillText('Regime', lx, ly);
      c.font = fonte(10.5, '700'); c.fillStyle = r.xShock !== null ? Plot.serie(6) : Plot.serie(2);
      /* quebra o nome do regime em linhas que caibam no painel */
      var palavras = r.regime.replace(/[()]/g, '').split(' '), linha = '', yl = ly + 17, larg = W * 0.26;
      palavras.forEach(function (pw) {
        var tent = linha ? linha + ' ' + pw : pw;
        if (c.measureText(tent).width > larg && linha) { c.fillText(linha, lx, yl); yl += 13; linha = pw; }
        else linha = tent;
      });
      if (linha) c.fillText(linha, lx, yl);
      [['vazão' + (r.choked ? ' (bloqueada)' : ''), sg(r.m, 4) + ' kg/s'],
       ['Mach na saída', sg(e.M, 3)], ['velocidade na saída', sg(e.V, 4) + ' m/s'],
       ['T na saída', sg(e.T - 273.15, 3) + ' °C'],
       ['1ª crítica', sg(r.Pc1, 4) + ' kPa'], ['choque na saída', sg(r.Pc2, 4) + ' kPa'], ['projeto', sg(r.Pc3, 4) + ' kPa']
      ].forEach(function (ln, j) {
        c.fillStyle = faint; c.font = fonte(9.5); c.fillText(ln[0], lx, ly + 62 + j * 27);
        c.fillStyle = cor; c.font = fonte(10.5, '700'); c.fillText(ln[1], lx, ly + 73 + j * 27);
      });
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('bocal');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx || !A.r) return;
      A.t += dt;
      /* avança as partículas com a velocidade local (escala visual) */
      var per = A.r.perfil, Vmax = 1;
      per.forEach(function (q) { Vmax = Math.max(Vmax, q.V); });
      (A.part || []).forEach(function (pt) {
        var j = Math.min(per.length - 1, Math.floor(pt.x * (per.length - 1)));
        pt.x += dt * 0.05 * (0.15 + 1.6 * per[j].V / Vmax);
        if (pt.x > 1) { pt.x = 0; pt.f = Math.random() * 2 - 1; }
      });
      desenha();
    });

    Sim.build('#sim-bocal', {
      titulo: 'Escoamento compressível — bocal convergente-divergente',
      descricao: 'Abaixando a pressão de saída, o escoamento acelera até a garganta ficar sônica — daí em diante a vazão não aumenta mais (bocal bloqueado). Na parte divergente o gás pode acelerar a supersônico ou sofrer um choque normal, conforme a contrapressão.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Subsônico em todo o bocal', desc: 'Contrapressão alta: funciona como Venturi', valores: { gas: 'ar', P0: 1000, T0: 800, At: 20, AeAt: 1.6875, Pb: 950, animar: true } },
        { nome: '2 · Choque na parte divergente', desc: 'Garganta sônica, choque no meio', valores: { gas: 'ar', P0: 1000, T0: 800, At: 20, AeAt: 1.6875, Pb: 700, animar: true } },
        { nome: '3 · Condição de projeto (Ma 2)', desc: 'Pressão de saída igual à ambiente', valores: { gas: 'ar', P0: 1000, T0: 800, At: 20, AeAt: 1.6875, Pb: 127.8, animar: true } },
        { nome: '4 · Sobre-expandido', desc: 'Choques oblíquos no jato', valores: { gas: 'ar', P0: 1000, T0: 800, At: 20, AeAt: 1.6875, Pb: 400, animar: true } },
        { nome: '5 · CO₂ do exemplo da aula', desc: '1400 kPa, 200 °C, 3 kg/s até 200 kPa', valores: { gas: 'co2', P0: 1400, T0: 473.15, At: 9.63, AeAt: 1.6951, Pb: 200, animar: true } },
        { nome: '6 · Tubeira de foguete', desc: 'Razão de áreas 8, subexpandido no vácuo', valores: { gas: 'vapor', P0: 5000, T0: 3000, At: 50, AeAt: 8, Pb: 20, animar: true } }
      ],
      controles: [
        { id: 'gas', tipo: 'select', label: 'Gás', valor: 'ar',
          opcoes: Object.keys(GASES).map(function (g) { return { v: g, t: GASES[g].nome + ' (k = ' + GASES[g].k + ')' }; }) },
        { id: 'P0', label: 'Pressão de estagnação P₀', min: 100, max: 6000, step: 10, valor: 1000, unidade: 'kPa' },
        { id: 'T0', label: 'Temperatura de estagnação T₀', min: 250, max: 3500, step: 1, valor: 800, unidade: 'K' },
        { id: 'At', label: 'Área da garganta', min: 1, max: 100, step: 0.01, valor: 20, unidade: 'cm²' },
        { id: 'AeAt', label: 'Razão de áreas A_saída / A_garganta', min: 1.01, max: 10, step: 0.0001, valor: 1.6875, unidade: '' },
        { id: 'Pb', label: 'Contrapressão (pressão na saída)', min: 1, max: 6000, step: 0.1, valor: 700, unidade: 'kPa',
          desc: 'desça devagar a partir de P₀ e observe os regimes' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'bocal', axes: false, height: 330, grid: false, legend: false },
        { id: 'pres', titulo: 'Pressão ao longo do bocal', xlabel: 'Posição (0 = entrada, 1 = saída)', ylabel: 'P / P₀', aspect: 0.50, legendPos: 'bottomleft' },
        { id: 'mach', titulo: 'Número de Mach ao longo do bocal', xlabel: 'Posição', ylabel: 'Ma', aspect: 0.40, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'reg', label: 'Regime' },
        { id: 'm', label: 'Vazão mássica' },
        { id: 'Me', label: 'Mach na saída' },
        { id: 'Ve', label: 'Velocidade na saída' },
        { id: 'Pc1', label: '1ª pressão crítica' },
        { id: 'Pc3', label: 'Pressão de projeto' }
      ],
      formulas: [
        { g: 'Estagnação e Mach' },
        { tex: 'h_0 = h + \\frac{V^2}{2}, \\qquad Ma = \\frac{V}{c}, \\qquad c = \\sqrt{kRT}', destaque: true },
        { tex: '\\frac{T_0}{T} = 1 + \\frac{k-1}{2}Ma^2 \\qquad \\frac{P_0}{P} = \\left(1 + \\frac{k-1}{2}Ma^2\\right)^{\\frac{k}{k-1}}', d: 'relações isentrópicas', destaque: true },
        { tex: '\\frac{A}{A^*} = \\frac{1}{Ma}\\left[\\frac{2}{k+1}\\left(1 + \\frac{k-1}{2}Ma^2\\right)\\right]^{\\frac{k+1}{2(k-1)}}', d: 'duas soluções: uma subsônica, uma supersônica' },
        { tex: '\\frac{dA}{A} = (Ma^2 - 1)\\frac{dV}{V}', d: 'subsônico acelera convergindo; supersônico acelera divergindo', destaque: true },
        { g: 'Garganta e vazão máxima' },
        { tex: '\\frac{P^*}{P_0} = \\left(\\frac{2}{k+1}\\right)^{\\frac{k}{k-1}} = 0{,}5283\\ (k = 1{,}4)' },
        { tex: '\\dot m_{máx} = A^* P_0 \\sqrt{\\frac{k}{RT_0}}\\left(\\frac{2}{k+1}\\right)^{\\frac{k+1}{2(k-1)}}', d: 'bocal bloqueado: não depende mais da contrapressão' },
        { g: 'Choque normal' },
        { tex: 'Ma_2^2 = \\frac{Ma_1^2 + \\frac{2}{k-1}}{\\frac{2k}{k-1}Ma_1^2 - 1}, \\qquad \\frac{P_2}{P_1} = \\frac{1 + kMa_1^2}{1 + kMa_2^2}', destaque: true },
        { tex: 'T_{02} = T_{01}, \\qquad P_{02} < P_{01}', d: 'adiabático mas irreversível: perde pressão de estagnação, gera entropia' }
      ],
      passos: [],
      nota: 'Escoamento unidimensional, isentrópico fora do choque, gás ideal com k constante. As relações reproduzem as tabelas A-32 e A-33 do Çengel (k = 1,4). Fora do bocal, os padrões de jato sobre- e subexpandido são ilustrativos.',
      calcular: function (p, ctx) {
        var gas = GASES[p.gas];
        var q = { P0: p.P0, T0: p.T0, k: gas.k, R: gas.R, At: p.At, Ae: p.At * p.AeAt, Ai: p.At * Math.max(3, p.AeAt * 1.3), Pb: Math.min(p.Pb, p.P0) };
        var r = TD2.bocal(q);
        A.ctx = ctx; A.p = q; A.r = r; A.on = !!p.animar;
        desenha();

        var xs = r.perfil.map(function (z) { return z.x; });
        var g = ctx.plot('pres').clear();
        /* família de curvas de referência */
        function curva(Pb) { return TD2.bocal(Object.assign({}, q, { Pb: Pb })).perfil.map(function (z) { return z.P / q.P0; }); }
        g.line(xs, curva(r.Pc1 * 1.0005), { color: Plot.cssVar('--text-faint', '#aaa'), width: 1.2, dash: [4, 3], label: '1ª crítica (subsônico)' });
        g.line(xs, curva(r.Pc3), { color: Plot.serie(2), width: 1.4, dash: [4, 3], label: 'projeto (supersônico)' });
        g.line(xs, r.perfil.map(function (z) { return z.P / q.P0; }), { color: Plot.serie(6), width: 3, label: 'esta contrapressão' });
        g.hline(TD2.iso(1, gas.k).P, { color: Plot.serie(0), width: 1.2, text: 'P*/P₀ = ' + sg(TD2.iso(1, gas.k).P, 4) });
        g.hline(q.Pb / q.P0, { color: Plot.serie(3), width: 1.2, text: 'P_b/P₀' });
        g.setLimits([0, 1], [0, 1.05]);
        g.draw();

        var gm = ctx.plot('mach').clear();
        gm.line(xs, r.perfil.map(function (z) { return z.M; }), { color: Plot.serie(6), width: 3, label: 'Mach' });
        gm.hline(1, { color: Plot.serie(0), width: 1.2, text: 'Ma = 1' });
        gm.vline(r.xg, { color: Plot.cssVar('--text-faint', '#999'), width: 1, text: 'garganta' });
        gm.draw();

        var e = r.perfil[r.perfil.length - 1], k = gas.k;
        var passos = [];
        passos.push({ t: '① Três pressões críticas definem os regimes',
          tex: '\\frac{A_e}{A^*} = ' + nt(p.AeAt, 4) + ' \\;\\Rightarrow\\; Ma_{sub} = ' + nt(r.Msub, 4) + ',\\ Ma_{sup} = ' + nt(r.Msup, 4),
          texSub: 'P_{c1} = ' + nt(r.Pc1, 4) + ',\\quad P_{choque\\ na\\ saída} = ' + nt(r.Pc2, 4) + ',\\quad P_{projeto} = ' + nt(r.Pc3, 4) + '\\ kPa',
          obs: 'Acima da 1ª crítica o bocal inteiro é subsônico. Entre ela e a pressão de choque na saída, há choque normal dentro da parte divergente. Abaixo disso, o bocal é supersônico até a saída e o ajuste à pressão externa acontece fora dele.' });
        passos.push({ t: '② Vazão',
          tex: r.choked ? '\\dot m = A^* P_0\\sqrt{\\frac{k}{RT_0}}\\left(\\frac{2}{k+1}\\right)^{\\frac{k+1}{2(k-1)}}' : '\\dot m = \\rho_e V_e A_e',
          texSub: '\\dot m = ' + nt(r.m, 4) + '\\ kg/s',
          obs: r.choked ? 'Com a garganta sônica, nenhuma informação de pressão consegue subir o escoamento contra ele: baixar mais a contrapressão não aumenta a vazão. É o bloqueio (choked flow).' : 'Sem bloqueio a vazão ainda depende da contrapressão, como num Venturi.' });
        if (r.choqueInfo) {
          var ci = r.choqueInfo;
          passos.push({ t: '③ Onde fica o choque',
            tex: '\\frac{A_x}{A^*} \\Rightarrow Ma_1,\\quad Ma_2 = f(Ma_1),\\quad P_{02} = P_{01}\\frac{P_{02}}{P_{01}},\\quad A_2^* = \\frac{A_x}{(A/A^*)_{Ma_2}}',
            texSub: 'A_x = ' + nt(r.Ashock, 4) + '\\ cm^2 \\Rightarrow Ma_1 = ' + nt(ci.M1, 4) + ',\\ Ma_2 = ' + nt(ci.c.M2, 4) + ',\\ P_{02} = ' + nt(ci.P02, 4) + '\\ kPa',
            obs: 'Procura-se a posição em que, depois do choque, o escoamento subsônico desacelera no divergente e sai exatamente na contrapressão. O choque destrói ' + sg(100 * (1 - ci.c.P0201), 3) + ' % da pressão de estagnação: é energia mecânica convertida em entropia.' });
        }
        passos.push({ t: (r.choqueInfo ? '④' : '③') + ' Condições na saída',
          tex: 'T_e = T_0\\left(1 + \\frac{k-1}{2}Ma_e^2\\right)^{-1},\\quad V_e = Ma_e\\sqrt{kRT_e}',
          texSub: 'Ma_e = ' + nt(e.M, 4) + ',\\ T_e = ' + nt(e.T, 4) + '\\ K,\\ V_e = ' + nt(e.V, 4) + '\\ m/s,\\ P_e = ' + nt(e.P, 4) + '\\ kPa',
          obs: 'A energia vem inteira da entalpia do gás: toda a queda de temperatura de ' + sg(q.T0 - e.T, 3) + ' K vira energia cinética. É o princípio de toda turbina a vapor e de todo motor de foguete.' });
        ctx.setPassos(passos);

        return {
          reg: { v: r.regime.split(' (')[0], u: '' },
          m: { v: r.m, u: 'kg/s', classe: 'destaque' },
          Me: { v: e.M, u: '' },
          Ve: { v: e.V, u: 'm/s' },
          Pc1: { v: r.Pc1, u: 'kPa' },
          Pc3: { v: r.Pc3, u: 'kPa' }
        };
      }
    });
  })();
})();
