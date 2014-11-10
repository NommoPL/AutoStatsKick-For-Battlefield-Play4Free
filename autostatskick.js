//CHANGE ONLY THESE LINES!!
//DO WHATEVER YOU WANT BUT YOU NEED TO KNOW HOW
var connection = {
    host: "",
    port: 1337,
    password: ""
}
var options = {
    kickForStatspadding: true, //Do you want to kick for statspadding? Write true if yes, write false if no
    statspaddingStats:
        {
            bestScore: 50000, //minimum bestScore to kick (bestScore from main profile page, non-map-related)
            killStreak: 180, //minimum killStreak to kick (killStreak from main profile page)
        },
    kickForWeaponStats: true, //Do you want to kick for WeaponStats (it's needed if you want to kick for HSR/ACC), write true if yes, write false if no
    kickForWeaponHSR: true, //Do you want to kick for HeadShotRatios? Write true if yes, write false if no
    kickForWeaponACC: true, //Do you want to kick for accuracy? Write true if yes, write false if no
    kickForBoltAction: false, //Do you want to kick for Bolt Action Sniper Rifle Stats? Write true if yes, write false if no
    minimumKills: 50, //minimum kills to kick (guess that's obvious :D)
    weaponStatsHSR:
        {
            boltActionHSR: 0.9, //All bolt-action sniper-rifles HeadShotRatio maximum ( 0.9 = 90% )
            semiAutoHSR: 0.65, //All semi-auto sniper-files HeadShotRatio maximum ( 0.65 = 65% )
            autoWeaponsHSR: 0.4, //All SMG/LMG/Assault Rifles + VSS/VSS+3, SVUA/SVUA+3 HeadShotRatio maximum (0.4 = 40% )
            deaglerexHSR: 0.75, //Deagle50, Steel Deagle50 and MP412-REX HeadShotRatio maximum (0.75 = 75%)
            pistolHSR: 0.65, //All pistols HeadShotRatio maximum (including scatter/nosfer, excluding Deagle, Steel Deagle, REX) (0.65 = 65%)
        },
    weaponStatsACC:
        {
            boltActionACC: 0.8, //All bolt-action sniper-rifles accuracy maximum ( 0.8 = 80% )
            semiAutoACC: 0.6, //All semi-atuo sniper-rifles accuracy maximum ( 0.6 = 60% )
            autoWeaponsACC: 0.5, //All SMG/LMG/Assault Rifles + VSS/VSS+3, SVUA/SVUA+3 accuracy maximum (0.5 = 50%)
            deaglerexACC: 0.75, //Deagle50, Steel Deagle50 and MP412-REX accuracy maximum (0.75 = 75%)
            pistolACC: 0.55, //All pistols accuracy maximum (excluding scatter/nosfer, Deagle, Steel Deagle, REX) (0.55 = 55%)
        }
}













































var p4f = require('nodep4frcon');
var http = require('http');
var diff = require('deep-diff').diff;

var rcon = new p4f.rcon(connection);

var oldPlayers = [];

function main() {
    rcon.getplayersids(function (newPlayers) {
        var differences = diff(oldPlayers, newPlayers);
        if (differences != null) {
            differences.forEach(function (onediff) {
                if (onediff['kind'] == 'A') {
                    if (onediff['item']['kind'] == 'N') {
                        console.log('[MAIN-LOGIC] Making get request for player: ' + onediff['item']['rhs']['playername']);

                        http.get('http://battlefield.play4free.com/en/profile/stats/' + onediff['item']['rhs']['nucleusid'] + '/' + onediff['item']['rhs']['profileid'] + '?g=[%22CoreStats%22,%22WeaponStats%22]', function (res) {
                            var dane = '';
                            res.on('data', function (chunk) {
                                dane += chunk;
                            });
                            res.on('end', function () {
                                console.log('[MAIN-CHECKER] Checking player: ' + onediff['item']['rhs']['playername']);

                                var kick = false,
                                    kick_reason = '';

                                if (options['kickForStatspadding']) {
                                    console.log('[MAIN-STATSPADDING] Checking statspadding for player: ' + onediff['item']['rhs']['playername']);
                                    var value = JSON.parse(dane);

                                    if (value['data']['CoreStats']['bestScore'] >= options['statspaddingStats']['bestScore']) {
                                        kick = true;
                                        kick_reason = 'Statspadding detected -> best score: ' + value['data']['CoreStats']['bestScore'];
                                    }
                                    if (value['data']['CoreStats']['killStreak'] >= options['statspaddingStats']['killStreak']) {
                                        kick = true;
                                        kick_reason = 'Statspadding detected -> kill streak: ' + value['data']['CoreStats']['bestScore'];
                                    }
                                }

                                if (options['kickForWeaponStats'] == true && kick == false) {
                                    console.log('[MAIN-WEAPONS] Checking weapons-stats for player: ' + onediff['item']['rhs']['playername']);

                                    wpns = value['data']['WeaponStats'];
                                    wpns.forEach(function (value) {
                                        if (value['kills'] >= options['minimumKills']) {

                                            var niceHSR = value['headshotratio'] * 100,
                                                niceACC = value['accuracy'] * 100;
                                            niceHSR = niceHSR.toFixed(0),
                                            niceACC = niceACC.toFixed(0);

                                            switch (value['description']['category']) {
                                                case 'sniper_rifle':
                                                    if (options['kickForWeaponHSR']) {
                                                        switch (value['description']['id']) {
                                                            case '3070': //VSS,SVUA
                                                            case '3108':
                                                            case '3045':
                                                            case '3105':
                                                                if (value['headshotratio'] >= options['weaponStatsHSR']['autoWeaponsHSR']) {
                                                                    kick = true;
                                                                    kick_reason = 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%';
                                                                }
                                                                break;
                                                            case '3066':  //M110, M110+3, SKS, M14, M14+3
                                                            case '3107':
                                                            case '3119':
                                                            case '3065':
                                                            case '3106':
                                                                if (value['headshotratio'] >= options['weaponStatsHSR']['semiAutoHSR']) {
                                                                    kick = true;
                                                                    kick_reason = 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%';
                                                                }
                                                                break;
                                                            default: //Bolt-Actions
                                                                if (options['kickForBoltAction']) {
                                                                    if (value['headshotratio'] >= options['weaponStatsHSR']['boltActionHSR']) {
                                                                        kick = true;
                                                                        kick_reason = 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%';
                                                                    }
                                                                }
                                                                break;
                                                        }
                                                    }

                                                    //Do we want to kick for ACCs ?
                                                    if (options['kickForWeaponACC'] == true && kick == false) {
                                                        switch (value['description']['id']) {
                                                            case '3070': //VSS,SVUA
                                                            case '3108':
                                                            case '3045':
                                                            case '3105':
                                                                if (value['accuracy'] >= options['weaponStatsACC']['autoWeaponsACC']) {
                                                                    kick = true;
                                                                    kick_reason = 'Cheating detected -> Accuracy (' + value['description']['name'] + '): ' + niceACC + '%';
                                                                }
                                                                break;
                                                            case '3066':  //M110, M110+3, SKS, M14, M14+3
                                                            case '3107':
                                                            case '3119':
                                                            case '3065':
                                                            case '3106':
                                                                if (value['accuracy'] >= options['weaponStatsACC']['semiAutoACC']) {
                                                                    kick = true;
                                                                    kick_reason = 'Cheating detected -> Accuracy (' + value['description']['name'] + '): ' + niceACC + '%';
                                                                }
                                                                break;
                                                            default: //Bolt-Actions
                                                                if (options['kickForBoltAction']) {
                                                                    if (value['accuracy'] >= options['weaponStatsACC']['boltActionACC']) {
                                                                        kick = true;
                                                                        kick_reason = 'Cheating detected -> Accuracy (' + value['description']['name'] + '): ' + niceACC + '%';
                                                                    }
                                                                }
                                                                break;
                                                        }
                                                    }
                                                    break;
                                                case 'pistol':
                                                    if (options['kickForWeaponHSR'] == true && kick == false) {
                                                        switch (value['description']['id'])
                                                        {
                                                            case '3115':
                                                            case '3118':
                                                            case '3020':
                                                                if (value['headshotratio'] >= options['weaponStatsHSR']['deaglerexHSR']) {
                                                                    kick = true;
                                                                    kick_reason = 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%';
                                                                }
                                                                break;
                                                            default:
                                                                if (value['headshotratio'] >= options['weaponStatsHSR']['pistolHSR']) {
                                                                    kick = true;
                                                                    kick_reason = 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%';
                                                                }
                                                                break;
                                                        }
                                                    }

                                                    if (options['kickForWeaponACC'] == true && kick == false) {
                                                        switch (value['description']['id']) {
                                                            case '3115':
                                                            case '3118':
                                                            case '3020':
                                                                if (value['accuracy'] >= options['weaponStatsACC']['deaglerexACC']) {
                                                                    kick = true;
                                                                    kick_reason = 'Cheating detected -> Accuracy (' + value['description']['name'] + '): ' + niceACC + '%';
                                                                }
                                                                break;
                                                            case '3124':
                                                            case '3123':
                                                            case '3125':
                                                                break;
                                                            default:
                                                                if (value['accuracy'] >= options['weaponStatsACC']['pistolACC']) {
                                                                    kick = true;
                                                                    kick_reason = 'Cheating detected -> Accuracy (' + value['description']['name'] + '): ' + niceACC + '%';
                                                                }
                                                                break;
                                                        }
                                                    }
                                                    break;
                                                case 'assault_rifle':
                                                case 'lmg':
                                                case 'smg':
                                                    if (options['kickForWeaponHSR'] == true && kick == false) {
                                                        if (value['headshotratio'] >= options['weaponStatsHSR']['autoWeaponsHSR']) {
                                                            kick = true;
                                                            kick_reason = 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%';
                                                        }
                                                    }

                                                    if (options['kickForWeaponACC'] == true && kick == false) {
                                                        if (value['accuracy'] >= options['weaponStatsACC']['autoWeaponsACC']) {
                                                            kick = true;
                                                            kick_reason = 'Cheating detected -> Accuracy (' + value['description']['name'] + '): ' + niceACC + '%';
                                                        }
                                                    }
                                                    break;
                                            }
                                        }
                                    });
                                }

                                if (kick) {
                                    rcon.kick(onediff['item']['rhs']['slot'], kick_reason);
                                    console.log('[KICK-STATUS] Kicked ' + onediff['item']['rhs']['playername'] + ' for: ' + kick_reason);
                                }

                            });
                        }).on('error', function (e) {
                            console.log('got error: ' + e.message);
                        });;
                    }
                }
            });
            
            oldPlayers = newPlayers;
        }
    });
};

setInterval(main, 5000);

