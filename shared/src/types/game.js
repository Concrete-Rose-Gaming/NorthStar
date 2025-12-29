"use strict";
// Core game type definitions
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardZone = exports.GamePhase = exports.CardType = void 0;
var CardType;
(function (CardType) {
    CardType["CHEF"] = "CHEF";
    CardType["RESTAURANT"] = "RESTAURANT";
    CardType["DISH"] = "DISH";
    CardType["CHARACTER"] = "CHARACTER";
})(CardType || (exports.CardType = CardType = {}));
var GamePhase;
(function (GamePhase) {
    GamePhase["SETUP"] = "SETUP";
    GamePhase["MULLIGAN"] = "MULLIGAN";
    GamePhase["ROUND"] = "ROUND";
    GamePhase["HEAD_TO_HEAD"] = "HEAD_TO_HEAD";
    GamePhase["VICTORY"] = "VICTORY";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
var CardZone;
(function (CardZone) {
    CardZone["DECK"] = "DECK";
    CardZone["HAND"] = "HAND";
    CardZone["BOARD"] = "BOARD";
    CardZone["DISCARD"] = "DISCARD";
})(CardZone || (exports.CardZone = CardZone = {}));
