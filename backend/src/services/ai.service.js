"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInsights = generateInsights;
var env_1 = require("../config/env");
function mockInsights(input) {
    var highlights = [];
    var recommendations = [];
    highlights.push("Occupancy is at ".concat(input.occupancy.toFixed(1), "% with RevPAR of \u20B9").concat(input.avgRevpar.toFixed(0), "."));
    highlights.push("ADR averages \u20B9".concat(input.avgAdr.toFixed(0), " across the selected period."));
    highlights.push("Guest sentiment sits at ".concat(input.avgRating.toFixed(1), "/5 from tracked reviews."));
    if (input.occupancy < 60) {
        recommendations.push('Occupancy is below target — consider promotional rates or OTA visibility boosts.');
    }
    else if (input.occupancy > 85) {
        recommendations.push('High occupancy — review ADR to capture additional revenue without losing demand.');
    }
    if (input.openComplaints > 0) {
        recommendations.push("Resolve ".concat(input.openComplaints, " open complaint(s) to protect review scores."));
    }
    if (input.openMaintenance > 0) {
        recommendations.push("Close out ".concat(input.openMaintenance, " maintenance issue(s) to avoid guest impact."));
    }
    if (input.avgRating < 4) {
        recommendations.push('Average rating is under 4.0 — audit recent feedback for recurring themes.');
    }
    if (recommendations.length === 0) {
        recommendations.push('Operations are healthy. Maintain current standards and monitor daily checks.');
    }
    return {
        summary: "Today the property recorded ".concat(input.reportsToday, " operations report(s). Revenue totals \u20B9").concat(input.totalRevenue.toFixed(0), " with ").concat(input.occupancy.toFixed(1), "% occupancy and an average guest rating of ").concat(input.avgRating.toFixed(1), "/5."),
        highlights: highlights,
        recommendations: recommendations,
        provider: 'mock',
    };
}
function openAiInsights(input) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt_1, resp, data, parsed, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 3, , 4]);
                    prompt_1 = "You are a hotel operations analyst. Given these metrics, return a JSON object with keys summary (string), highlights (string[]), recommendations (string[]). Metrics: ".concat(JSON.stringify(input));
                    return [4 /*yield*/, fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: "Bearer ".concat(env_1.env.ai.apiKey),
                            },
                            body: JSON.stringify({
                                model: env_1.env.ai.model,
                                messages: [{ role: 'user', content: prompt_1 }],
                                response_format: { type: 'json_object' },
                            }),
                        })];
                case 1:
                    resp = _d.sent();
                    if (!resp.ok)
                        throw new Error("AI provider error: ".concat(resp.status));
                    return [4 /*yield*/, resp.json()];
                case 2:
                    data = (_d.sent());
                    parsed = JSON.parse(data.choices[0].message.content);
                    return [2 /*return*/, {
                            summary: (_a = parsed.summary) !== null && _a !== void 0 ? _a : '',
                            highlights: (_b = parsed.highlights) !== null && _b !== void 0 ? _b : [],
                            recommendations: (_c = parsed.recommendations) !== null && _c !== void 0 ? _c : [],
                            provider: 'openai',
                        }];
                case 3:
                    err_1 = _d.sent();
                    console.error('[ai:fallback]', err_1);
                    return [2 /*return*/, mockInsights(input)];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function generateInsights(input) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (env_1.env.ai.provider === 'openai' && env_1.env.ai.apiKey) {
                return [2 /*return*/, openAiInsights(input)];
            }
            return [2 /*return*/, mockInsights(input)];
        });
    });
}
