import React from 'react';
import { Activity, Thermometer, Zap, Droplet, Hash, CheckCircle2 } from 'lucide-react';

// Helpers to map icon and color based on type
const getIcon = (type) => {
    switch (type) {
        case 'speed': return <Activity size={24} />;
        case 'temp': return <Thermometer size={24} />;
        case 'battery': return <Zap size={24} />;
        case 'fuel': return <Droplet size={24} />;
        case 'count': return <Hash size={24} />;
        case 'vehicles': return <CheckCircle2 size={24} />;
        default: return <Activity size={24} />;
    }
};

const getColorClass = (type) => {
    switch (type) {
        case 'battery':
        case 'vehicles': return 'green';
        case 'fuel':
        case 'temp': return 'orange';
        case 'count':
        case 'speed': return 'blue';
        default: return 'blue';
    }
};

const KpiCard = ({ title, value, type, suffix = '' }) => {
    return (
        <div className="kpi-card">
            <div className={`kpi-icon ${getColorClass(type)}`}>
                {getIcon(type)}
            </div>
            <div className="kpi-content">
                <span className="kpi-label">{title}</span>
                <span className="kpi-value">
                    {value !== null && value !== undefined && !isNaN(value) ? `${value}${suffix}` : '--'}
                </span>
            </div>
        </div>
    );
};

export default KpiCard;
