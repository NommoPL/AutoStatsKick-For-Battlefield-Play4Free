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
            'bestScore': 50000, //minimum bestScore to kick (bestScore from main profile page, non-map-related)
            'killStreak': 180, //minimum killStreak to kick (killStreak from main profile page)
        },
    kickForWeaponStats: true, //Do you want to kick for Weapon Stats? Write true if yes, write false if no
    weaponStats:
        {
            'minimumKills': 50, //minimum kills to kick (guess that's obvious :D)
            'boltActionHSR': 0.95, //All bolt-action sniper-rifles HeadShotRatio maximum ( 0.95 = 95% )
            'semiAutoHSR': 0.65, //All semi-auto sniper-files HeadShotRatio maximum ( 0.65 = 65% )
            'autoWeaponsHSR': 0.4, //All SMG/LMG/Assault Rifles + VSS/VSS+3, SVUA/SVUA+3 HeadShotRatio maximum (0.4 = 40% )
            'deaglerexHSR': 0.75, //Deagle50, Steel Deagle50 and MP412-REX HeadShotRatio maximum (0.75 = 75%)
            'pistolHSR': 0.65, //All pistols HeadShotRatio maximum (including scatter/nosfer, excluding Deagle, Steel Deagle, REX) (0.65 = 65%)
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

                                if (options['kickForStatspadding']) {
                                    console.log('[MAIN-STATSPADDING] Checking statspadding for player: ' + onediff['item']['rhs']['playername']);
                                    var value = JSON.parse(dane);

                                    if (value['data']['CoreStats']['bestScore'] >= options['statspaddingStats']['bestScore']) {
                                        console.log('Kicking: ' + onediff['item']['rhs']['playername'] + ' for bestScore >= ' + options['statspaddingStats']['bestScore']);
                                        rcon.kick(onediff['item']['rhs']['slot'], 'Statspadding detected -> best score: ' + value['data']['CoreStats']['bestScore']);
                                    }
                                    if (value['data']['CoreStats']['killStreak'] >= options['statspaddingStats']['killStreak']) {
                                        console.log('Kicking: ' + onediff['item']['rhs']['playername'] + ' for killStreak >= ' + options['statspaddingStats']['killStreak']);
                                        rcon.kick(onediff['item']['rhs']['slot'], 'Statspadding detected -> kill streak: ' + value['data']['CoreStats']['bestScore']);
                                    }
                                }

                                if (options['kickForWeaponStats']) {
                                    console.log('[MAIN-WEAPONS] Checking weapons-stats for player: ' + onediff['item']['rhs']['playername']);

                                    wpns = value['data']['WeaponStats'];
                                    wpns.forEach(function (value) {
                                        if (value['kills'] >= options['weaponStats']['minimumKills']) {

                                            var niceHSR = value['headshotratio'] * 100;
                                            niceHSR = niceHSR.toFixed(0);

                                            if (value['description']['category'] == 'sniper_rifle') {
                                                //VSS,VSS+3,SVU-A,SVU-A+3
                                                if (value['description']['id'] == '3070' || value['description']['id'] == '3108' || value['description']['id'] == '3045' || value['description']['id'] == '3105') {
                                                    if (value['headshotratio'] >= options['weaponStats']['autoWeaponsHSR']) {
                                                        console.log('[VSS/SVUA] HSR ' + value['description']['name'] + ' = [ ' + value['headshotratio'] + ' ] ' + onediff['item']['rhs']['playername']);
                                                        rcon.kick(onediff['item']['rhs']['slot'], 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%');
                                                    }
                                                }
                                                else {
                                                    //Semi-Auto (M110, M110+3, SKS, M14, M14+3
                                                    if (value['description']['id'] == '3066' || value['description']['id'] == '3107' || value['description']['id'] == '3119' || value['description']['id'] == '3065' || value['description']['id'] == '3106') {
                                                        if (value['headshotratio'] >= options['weaponStats']['semiAutoHSR']) {
                                                            console.log('[Semi-Auto SNIPER-RIFLE] HSR ' + value['description']['name'] + ' = [ ' + value['headshotratio'] + ' ] ' + onediff['item']['rhs']['playername']);
                                                            rcon.kick(onediff['item']['rhs']['slot'], 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%');
                                                        }
                                                    }
                                                    //Bolt-Action
                                                    else {
                                                        if (value['headshotratio'] >= options['weaponStats']['boltActionHSR']) {
                                                            console.log('[Bolt-Action SNIPER-RIFLE] HSR ' + value['description']['name'] + ' = [ ' + value['headshotratio'] + ' ] ' + onediff['item']['rhs']['playername']);
                                                            rcon.kick(onediff['item']['rhs']['slot'], 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%');
                                                        }
                                                    }
                                                }
                                            }
                                            else if (value['description']['category'] == 'pistol') {
                                                if (value['description']['id'] == '3115' || value['description']['id'] == '3118' || value['description']['id'] == '3020') {
                                                    if (value['headshotratio'] >= options['weaponStats']['deaglerexHSR']) {
                                                        console.log('[DEAGLE/REX] HSR ' + value['description']['name'] + ' = [ ' + value['headshotratio'] + ' ] ' + onediff['item']['rhs']['playername']);
                                                        rcon.kick(onediff['item']['rhs']['slot'], 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%');
                                                    }
                                                }
                                                else {
                                                    if (value['headshotratio'] >= options['weaponStats']['pistolHSR']) {
                                                        console.log('[PISTOL] HSR ' + value['description']['name'] + ' = [ ' + value['headshotratio'] + ' ] ' + onediff['item']['rhs']['playername']);
                                                        rcon.kick(onediff['item']['rhs']['slot'], 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%');
                                                    }
                                                }
                                            }
                                            else if (value['description']['category'] == 'assault_rifle' || value['description']['category'] == 'lmg' || value['description']['category'] == 'smg') {
                                                if (value['headshotratio'] >= options['weaponStats']['autoWeaponsHSR']) {
                                                    console.log('[OTHER-WEAPON] HSR ' + value['description']['name'] + ' = [ ' + value['headshotratio'] + ' ] ' + onediff['item']['rhs']['playername']);
                                                    rcon.kick(onediff['item']['rhs']['slot'], 'Cheating detected -> HSR (' + value['description']['name'] + '): ' + niceHSR + '%');
                                                }
                                            }
                                        }
                                    });
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

