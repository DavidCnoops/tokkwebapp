///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    export interface ICountry {
        code: string;
        name: string;
        EU?: boolean;
    }

    export class Countries {
        public list: Array<ICountry>;

        constructor() {
			this.list = [
                {
                    'code': 'AD',
                    'name': 'Andorra'
                },
                {
                    'code': 'AE',
                    'name': 'United Arab Emirates'
                },
                {
                    'code': 'AF',
                    'name': 'Afghanistan'
                },
                {
                    'code': 'AG',
                    'name': 'Antigua and Barbuda'
                },
                {
                    'code': 'AI',
                    'name': 'Anguilla'
                },
                {
                    'code': 'AL',
                    'name': 'Albania'
                },
                {
                    'code': 'AM',
                    'name': 'Armenia'
                },
                {
                    'code': 'AO',
                    'name': 'Angola'
                },
                {
                    'code': 'AQ',
                    'name': 'Antarctica'
                },
                {
                    'code': 'AR',
                    'name': 'Argentina'
                },
                {
                    'code': 'AS',
                    'name': 'American Samoa'
                },
                {
                    'code': 'AT',
                    'name': 'Austria',
                    'EU': true
                },
                {
                    'code': 'AU',
                    'name': 'Australia'
                },
                {
                    'code': 'AW',
                    'name': 'Aruba'
                },
                {
                    'code': 'AX',
                    'name': 'Åland'
                },
                {
                    'code': 'AZ',
                    'name': 'Azerbaijan'
                },
                {
                    'code': 'BA',
                    'name': 'Bosnia and Herzegovina'
                },
                {
                    'code': 'BB',
                    'name': 'Barbados'
                },
                {
                    'code': 'BD',
                    'name': 'Bangladesh'
                },
                {
                    'code': 'BE',
                    'name': 'Belgium',
                    'EU': true
                },
                {
                    'code': 'BF',
                    'name': 'Burkina Faso'
                },
                {
                    'code': 'BG',
                    'name': 'Bulgaria',
                    'EU': true
                },
                {
                    'code': 'BH',
                    'name': 'Bahrain'
                },
                {
                    'code': 'BI',
                    'name': 'Burundi'
                },
                {
                    'code': 'BJ',
                    'name': 'Benin'
                },
                {
                    'code': 'BL',
                    'name': 'Saint Barthélemy'
                },
                {
                    'code': 'BM',
                    'name': 'Bermuda'
                },
                {
                    'code': 'BN',
                    'name': 'Brunei'
                },
                {
                    'code': 'BO',
                    'name': 'Bolivia'
                },
                {
                    'code': 'BQ',
                    'name': 'Bonaire'
                },
                {
                    'code': 'BR',
                    'name': 'Brazil'
                },
                {
                    'code': 'BS',
                    'name': 'Bahamas'
                },
                {
                    'code': 'BT',
                    'name': 'Bhutan'
                },
                {
                    'code': 'BV',
                    'name': 'Bouvet Island'
                },
                {
                    'code': 'BW',
                    'name': 'Botswana'
                },
                {
                    'code': 'BY',
                    'name': 'Belarus'
                },
                {
                    'code': 'BZ',
                    'name': 'Belize'
                },
                {
                    'code': 'CA',
                    'name': 'Canada'
                },
                {
                    'code': 'CC',
                    'name': 'Cocos (Keeling) Islands'
                },
                {
                    'code': 'CD',
                    'name': 'Democratic Republic of the Congo'
                },
                {
                    'code': 'CF',
                    'name': 'Central African Republic'
                },
                {
                    'code': 'CG',
                    'name': 'Republic of the Congo'
                },
                {
                    'code': 'CH',
                    'name': 'Switzerland'
                },
                {
                    'code': 'CI',
                    'name': 'Ivory Coast'
                },
                {
                    'code': 'CK',
                    'name': 'Cook Islands'
                },
                {
                    'code': 'CL',
                    'name': 'Chile'
                },
                {
                    'code': 'CM',
                    'name': 'Cameroon'
                },
                {
                    'code': 'CN',
                    'name': 'China'
                },
                {
                    'code': 'CO',
                    'name': 'Colombia'
                },
                {
                    'code': 'CR',
                    'name': 'Costa Rica'
                },
                {
                    'code': 'CU',
                    'name': 'Cuba'
                },
                {
                    'code': 'CV',
                    'name': 'Cape Verde'
                },
                {
                    'code': 'CW',
                    'name': 'Curacao'
                },
                {
                    'code': 'CX',
                    'name': 'Christmas Island'
                },
                {
                    'code': 'CY',
                    'name': 'Cyprus',
                    'EU': true
                },
                {
                    'code': 'CZ',
                    'name': 'Czech Republic',
                    'EU': true
                },
                {
                    'code': 'DE',
                    'name': 'Germany',
                    'EU': true
                },
                {
                    'code': 'DJ',
                    'name': 'Djibouti'
                },
                {
                    'code': 'DK',
                    'name': 'Denmark',
                    'EU': true
                },
                {
                    'code': 'DM',
                    'name': 'Dominica'
                },
                {
                    'code': 'DO',
                    'name': 'Dominican Republic'
                },
                {
                    'code': 'DZ',
                    'name': 'Algeria'
                },
                {
                    'code': 'EC',
                    'name': 'Ecuador'
                },
                {
                    'code': 'EE',
                    'name': 'Estonia',
                    'EU': true
                },
                {
                    'code': 'EG',
                    'name': 'Egypt'
                },
                {
                    'code': 'EH',
                    'name': 'Western Sahara'
                },
                {
                    'code': 'ER',
                    'name': 'Eritrea'
                },
                {
                    'code': 'ES',
                    'name': 'Spain',
                    'EU': true
                },
                {
                    'code': 'ET',
                    'name': 'Ethiopia'
                },
                {
                    'code': 'FI',
                    'name': 'Finland',
                    'EU': true
                },
                {
                    'code': 'FJ',
                    'name': 'Fiji'
                },
                {
                    'code': 'FK',
                    'name': 'Falkland Islands'
                },
                {
                    'code': 'FM',
                    'name': 'Micronesia'
                },
                {
                    'code': 'FO',
                    'name': 'Faroe Islands'
                },
                {
                    'code': 'FR',
                    'name': 'France',
                    'EU': true
                },
                {
                    'code': 'GA',
                    'name': 'Gabon'
                },
                {
                    'code': 'GB',
                    'name': 'United Kingdom',
                    'EU': true
                },
                {
                    'code': 'GD',
                    'name': 'Grenada'
                },
                {
                    'code': 'GE',
                    'name': 'Georgia'
                },
                {
                    'code': 'GF',
                    'name': 'French Guiana'
                },
                {
                    'code': 'GG',
                    'name': 'Guernsey'
                },
                {
                    'code': 'GH',
                    'name': 'Ghana'
                },
                {
                    'code': 'GI',
                    'name': 'Gibraltar'
                },
                {
                    'code': 'GL',
                    'name': 'Greenland'
                },
                {
                    'code': 'GM',
                    'name': 'Gambia'
                },
                {
                    'code': 'GN',
                    'name': 'Guinea'
                },
                {
                    'code': 'GP',
                    'name': 'Guadeloupe'
                },
                {
                    'code': 'GQ',
                    'name': 'Equatorial Guinea'
                },
                {
                    'code': 'GR',
                    'name': 'Greece',
                    'EU': true
                },
                {
                    'code': 'GS',
                    'name': 'South Georgia and the South Sandwich Islands'
                },
                {
                    'code': 'GT',
                    'name': 'Guatemala'
                },
                {
                    'code': 'GU',
                    'name': 'Guam'
                },
                {
                    'code': 'GW',
                    'name': 'Guinea-Bissau'
                },
                {
                    'code': 'GY',
                    'name': 'Guyana'
                },
                {
                    'code': 'HK',
                    'name': 'Hong Kong'
                },
                {
                    'code': 'HM',
                    'name': 'Heard Island and McDonald Islands'
                },
                {
                    'code': 'HN',
                    'name': 'Honduras'
                },
                {
                    'code': 'HR',
                    'name': 'Croatia',
                    'EU': true
                },
                {
                    'code': 'HT',
                    'name': 'Haiti'
                },
                {
                    'code': 'HU',
                    'name': 'Hungary',
                    'EU': true
                },
                {
                    'code': 'ID',
                    'name': 'Indonesia'
                },
                {
                    'code': 'IE',
                    'name': 'Ireland',
                    'EU': true
                },
                {
                    'code': 'IL',
                    'name': 'Israel'
                },
                {
                    'code': 'IM',
                    'name': 'Isle of Man'
                },
                {
                    'code': 'IN',
                    'name': 'India'
                },
                {
                    'code': 'IO',
                    'name': 'British Indian Ocean Territory'
                },
                {
                    'code': 'IQ',
                    'name': 'Iraq'
                },
                {
                    'code': 'IR',
                    'name': 'Iran'
                },
                {
                    'code': 'IS',
                    'name': 'Iceland'
                },
                {
                    'code': 'IT',
                    'name': 'Italy',
                    'EU': true
                },
                {
                    'code': 'JE',
                    'name': 'Jersey'
                },
                {
                    'code': 'JM',
                    'name': 'Jamaica'
                },
                {
                    'code': 'JO',
                    'name': 'Jordan'
                },
                {
                    'code': 'JP',
                    'name': 'Japan'
                },
                {
                    'code': 'KE',
                    'name': 'Kenya'
                },
                {
                    'code': 'KG',
                    'name': 'Kyrgyzstan'
                },
                {
                    'code': 'KH',
                    'name': 'Cambodia'
                },
                {
                    'code': 'KI',
                    'name': 'Kiribati'
                },
                {
                    'code': 'KM',
                    'name': 'Comoros'
                },
                {
                    'code': 'KN',
                    'name': 'Saint Kitts and Nevis'
                },
                {
                    'code': 'KP',
                    'name': 'North Korea'
                },
                {
                    'code': 'KR',
                    'name': 'South Korea'
                },
                {
                    'code': 'KW',
                    'name': 'Kuwait'
                },
                {
                    'code': 'KY',
                    'name': 'Cayman Islands'
                },
                {
                    'code': 'KZ',
                    'name': 'Kazakhstan'
                },
                {
                    'code': 'LA',
                    'name': 'Laos'
                },
                {
                    'code': 'LB',
                    'name': 'Lebanon'
                },
                {
                    'code': 'LC',
                    'name': 'Saint Lucia'
                },
                {
                    'code': 'LI',
                    'name': 'Liechtenstein'
                },
                {
                    'code': 'LK',
                    'name': 'Sri Lanka'
                },
                {
                    'code': 'LR',
                    'name': 'Liberia'
                },
                {
                    'code': 'LS',
                    'name': 'Lesotho'
                },
                {
                    'code': 'LT',
                    'name': 'Lithuania',
                    'EU': true
                },
                {
                    'code': 'LU',
                    'name': 'Luxembourg',
                    'EU': true
                },
                {
                    'code': 'LV',
                    'name': 'Latvia',
                    'EU': true
                },
                {
                    'code': 'LY',
                    'name': 'Libya'
                },
                {
                    'code': 'MA',
                    'name': 'Morocco'
                },
                {
                    'code': 'MC',
                    'name': 'Monaco'
                },
                {
                    'code': 'MD',
                    'name': 'Moldova'
                },
                {
                    'code': 'ME',
                    'name': 'Montenegro'
                },
                {
                    'code': 'MF',
                    'name': 'Saint Martin'
                },
                {
                    'code': 'MG',
                    'name': 'Madagascar'
                },
                {
                    'code': 'MH',
                    'name': 'Marshall Islands'
                },
                {
                    'code': 'MK',
                    'name': 'Macedonia'
                },
                {
                    'code': 'ML',
                    'name': 'Mali'
                },
                {
                    'code': 'MM',
                    'name': 'Myanmar [Burma]'
                },
                {
                    'code': 'MN',
                    'name': 'Mongolia'
                },
                {
                    'code': 'MO',
                    'name': 'Macao'
                },
                {
                    'code': 'MP',
                    'name': 'Northern Mariana Islands'
                },
                {
                    'code': 'MQ',
                    'name': 'Martinique'
                },
                {
                    'code': 'MR',
                    'name': 'Mauritania'
                },
                {
                    'code': 'MS',
                    'name': 'Montserrat'
                },
                {
                    'code': 'MT',
                    'name': 'Malta',
                    'EU': true
                },
                {
                    'code': 'MU',
                    'name': 'Mauritius'
                },
                {
                    'code': 'MV',
                    'name': 'Maldives'
                },
                {
                    'code': 'MW',
                    'name': 'Malawi'
                },
                {
                    'code': 'MX',
                    'name': 'Mexico'
                },
                {
                    'code': 'MY',
                    'name': 'Malaysia'
                },
                {
                    'code': 'MZ',
                    'name': 'Mozambique'
                },
                {
                    'code': 'NA',
                    'name': 'Namibia'
                },
                {
                    'code': 'NC',
                    'name': 'New Caledonia'
                },
                {
                    'code': 'NE',
                    'name': 'Niger'
                },
                {
                    'code': 'NF',
                    'name': 'Norfolk Island'
                },
                {
                    'code': 'NG',
                    'name': 'Nigeria'
                },
                {
                    'code': 'NI',
                    'name': 'Nicaragua'
                },
                {
                    'code': 'NL',
                    'name': 'Netherlands',
                    'EU': true
                },
                {
                    'code': 'NO',
                    'name': 'Norway'
                },
                {
                    'code': 'NP',
                    'name': 'Nepal'
                },
                {
                    'code': 'NR',
                    'name': 'Nauru'
                },
                {
                    'code': 'NU',
                    'name': 'Niue'
                },
                {
                    'code': 'NZ',
                    'name': 'New Zealand'
                },
                {
                    'code': 'OM',
                    'name': 'Oman'
                },
                {
                    'code': 'PA',
                    'name': 'Panama'
                },
                {
                    'code': 'PE',
                    'name': 'Peru'
                },
                {
                    'code': 'PF',
                    'name': 'French Polynesia'
                },
                {
                    'code': 'PG',
                    'name': 'Papua New Guinea'
                },
                {
                    'code': 'PH',
                    'name': 'Philippines'
                },
                {
                    'code': 'PK',
                    'name': 'Pakistan'
                },
                {
                    'code': 'PL',
                    'name': 'Poland',
                    'EU': true
                },
                {
                    'code': 'PM',
                    'name': 'Saint Pierre and Miquelon'
                },
                {
                    'code': 'PN',
                    'name': 'Pitcairn Islands'
                },
                {
                    'code': 'PR',
                    'name': 'Puerto Rico'
                },
                {
                    'code': 'PS',
                    'name': 'Palestine'
                },
                {
                    'code': 'PT',
                    'name': 'Portugal',
                    'EU': true
                },
                {
                    'code': 'PW',
                    'name': 'Palau'
                },
                {
                    'code': 'PY',
                    'name': 'Paraguay'
                },
                {
                    'code': 'QA',
                    'name': 'Qatar'
                },
                {
                    'code': 'RE',
                    'name': 'Réunion'
                },
                {
                    'code': 'RO',
                    'name': 'Romania',
                    'EU': true
                },
                {
                    'code': 'RS',
                    'name': 'Serbia'
                },
                {
                    'code': 'RU',
                    'name': 'Russia'
                },
                {
                    'code': 'RW',
                    'name': 'Rwanda'
                },
                {
                    'code': 'SA',
                    'name': 'Saudi Arabia'
                },
                {
                    'code': 'SB',
                    'name': 'Solomon Islands'
                },
                {
                    'code': 'SC',
                    'name': 'Seychelles'
                },
                {
                    'code': 'SD',
                    'name': 'Sudan'
                },
                {
                    'code': 'SE',
                    'name': 'Sweden',
                    'EU': true
                },
                {
                    'code': 'SG',
                    'name': 'Singapore'
                },
                {
                    'code': 'SH',
                    'name': 'Saint Helena'
                },
                {
                    'code': 'SI',
                    'name': 'Slovenia',
                    'EU': true
                },
                {
                    'code': 'SJ',
                    'name': 'Svalbard and Jan Mayen'
                },
                {
                    'code': 'SK',
                    'name': 'Slovakia',
                    'EU': true
                },
                {
                    'code': 'SL',
                    'name': 'Sierra Leone'
                },
                {
                    'code': 'SM',
                    'name': 'San Marino'
                },
                {
                    'code': 'SN',
                    'name': 'Senegal'
                },
                {
                    'code': 'SO',
                    'name': 'Somalia'
                },
                {
                    'code': 'SR',
                    'name': 'Suriname'
                },
                {
                    'code': 'SS',
                    'name': 'South Sudan'
                },
                {
                    'code': 'ST',
                    'name': 'São Tomé and Príncipe'
                },
                {
                    'code': 'SV',
                    'name': 'El Salvador'
                },
                {
                    'code': 'SX',
                    'name': 'Sint Maarten'
                },
                {
                    'code': 'SY',
                    'name': 'Syria'
                },
                {
                    'code': 'SZ',
                    'name': 'Swaziland'
                },
                {
                    'code': 'TC',
                    'name': 'Turks and Caicos Islands'
                },
                {
                    'code': 'TD',
                    'name': 'Chad'
                },
                {
                    'code': 'TF',
                    'name': 'French Southern Territories'
                },
                {
                    'code': 'TG',
                    'name': 'Togo'
                },
                {
                    'code': 'TH',
                    'name': 'Thailand'
                },
                {
                    'code': 'TJ',
                    'name': 'Tajikistan'
                },
                {
                    'code': 'TK',
                    'name': 'Tokelau'
                },
                {
                    'code': 'TL',
                    'name': 'East Timor'
                },
                {
                    'code': 'TM',
                    'name': 'Turkmenistan'
                },
                {
                    'code': 'TN',
                    'name': 'Tunisia'
                },
                {
                    'code': 'TO',
                    'name': 'Tonga'
                },
                {
                    'code': 'TR',
                    'name': 'Turkey'
                },
                {
                    'code': 'TT',
                    'name': 'Trinidad and Tobago'
                },
                {
                    'code': 'TV',
                    'name': 'Tuvalu'
                },
                {
                    'code': 'TW',
                    'name': 'Taiwan'
                },
                {
                    'code': 'TZ',
                    'name': 'Tanzania'
                },
                {
                    'code': 'UA',
                    'name': 'Ukraine'
                },
                {
                    'code': 'UG',
                    'name': 'Uganda'
                },
                {
                    'code': 'UM',
                    'name': 'U.S. Minor Outlying Islands'
                },
                {
                    'code': 'US',
                    'name': 'United States'
                },
                {
                    'code': 'UY',
                    'name': 'Uruguay'
                },
                {
                    'code': 'UZ',
                    'name': 'Uzbekistan'
                },
                {
                    'code': 'VA',
                    'name': 'Vatican City'
                },
                {
                    'code': 'VC',
                    'name': 'Saint Vincent and the Grenadines'
                },
                {
                    'code': 'VE',
                    'name': 'Venezuela'
                },
                {
                    'code': 'VG',
                    'name': 'British Virgin Islands'
                },
                {
                    'code': 'VI',
                    'name': 'U.S. Virgin Islands'
                },
                {
                    'code': 'VN',
                    'name': 'Vietnam'
                },
                {
                    'code': 'VU',
                    'name': 'Vanuatu'
                },
                {
                    'code': 'WF',
                    'name': 'Wallis and Futuna'
                },
                {
                    'code': 'WS',
                    'name': 'Samoa'
                },
                {
                    'code': 'XK',
                    'name': 'Kosovo'
                },
                {
                    'code': 'YE',
                    'name': 'Yemen'
                },
                {
                    'code': 'YT',
                    'name': 'Mayotte'
                },
                {
                    'code': 'ZA',
                    'name': 'South Africa'
                },
                {
                    'code': 'ZM',
                    'name': 'Zambia'
                },
                {
                    'code': 'ZW',
                    'name': 'Zimbabwe'
                }
            ];
		}
    }

    angular.module('app').service('Countries', Countries);
}