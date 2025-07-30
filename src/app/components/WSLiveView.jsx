"use client"

import { useEffect, useState, useRef } from "react"
import {
    BaselineSeries,
    createChart,
    CrosshairMode,
    HistogramSeries,
    LineStyle,
} from "lightweight-charts";
import WebSocketSerive from "../services/websocketdelay"
import TokenService from "../services/TokenService"

