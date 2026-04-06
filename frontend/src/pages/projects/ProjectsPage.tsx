import React, { useEffect, useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjects, createProject, deleteProject, fetchCategories, updateProject } from '../../store/slices/projectSlice';
import { fetchTemplates } from '../../store/slices/templateSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { fetchClients } from '../../store/slices/clientSlice';
import { fetchDepartments } from '../../store/slices/departmentSlice';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Avatar from '../../components/Avatar';
import CustomSelect from '../../components/ui/CustomSelect';
import {
  Plus, CheckSquare, Trash2, Search as SearchIcon, FolderKanban, Lock,
  Calendar, ArrowRight, TrendingUp, Clock, Layers, BarChart3, Filter, X,
  LayoutGrid, List, ChevronDown
} from 'lucide-react';
import type { Project } from '../../types';
import { isAdminOrManager, isEmployee } from '../../constants/roles';
import {
  PROJECT_STATUS_CONFIG,
  PROJECT_STATUS_OPTIONS,
  type ProjectStatusValue,
} from '../../constants/statusConstants';

/* ─── Styles ─── */
const styles = `
  /* ── Stats Cards ── */
  .projects-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }

  .stat-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px 18px;
    border-radius: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: default;
  }
  .stat-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 14px;
    opacity: 0.06;
    transition: opacity 0.3s;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -6px rgba(0,0,0,0.08);
  }
  .dark .stat-card:hover {
    box-shadow: 0 8px 24px -6px rgba(0,0,0,0.35);
  }
  .stat-card:hover::before { opacity: 0.12; }

  .stat-card--planning::before { background: #94a3b8; }
  .stat-card--in_progress::before { background: #3b82f6; }
  .stat-card--completed::before { background: #10b981; }
  .stat-card--on_hold::before { background: #f59e0b; }
  .stat-card--total::before { background: var(--primary); }

  .stat-card__icon {
    width: 34px; height: 34px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .stat-card__value {
    font-size: 24px; font-weight: 700;
    line-height: 1;
    color: var(--text-main);
  }
  .stat-card__label {
    font-size: 12px; font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── Filter Bar ── */
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .filter-bar__search {
    flex: 1;
    min-width: 200px;
    position: relative;
  }
  .filter-bar__search-icon {
    position: absolute;
    left: 12px; top: 50%; transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }
  .filter-bar__search input {
    width: 100%;
    padding: 9px 14px 9px 38px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text-main);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .filter-bar__search input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
  }
  .dark .filter-bar__search input:focus {
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.12);
  }
  .filter-bar__search input::placeholder { color: var(--text-muted); }

  .active-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .active-filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px 4px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text-main);
    cursor: pointer;
    transition: all 0.15s;
  }
  .active-filter-pill:hover {
    border-color: var(--danger);
    color: var(--danger);
  }
  .active-filter-pill__dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Project Cards Grid ── */
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 20px;
  }
  @media (max-width: 768px) {
    .projects-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Project Card ── */
  .project-card {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .project-card:hover {
    transform: translateY(-3px);
    border-color: var(--primary);
    box-shadow:
      0 12px 32px -8px rgba(79, 70, 229, 0.10),
      0 4px 12px -4px rgba(0, 0, 0, 0.06);
  }
  .dark .project-card:hover {
    box-shadow:
      0 12px 32px -8px rgba(129, 140, 248, 0.12),
      0 4px 12px -4px rgba(0, 0, 0, 0.3);
  }
  .project-card--archived {
    opacity: 0.7;
  }
  .project-card--locked {
    cursor: not-allowed;
    filter: grayscale(0.15);
  }
  .project-card--locked:hover {
    transform: none;
    border-color: var(--border);
    box-shadow: none;
  }

  .project-card__accent {
    height: 3px;
    width: 100%;
    flex-shrink: 0;
  }
  .project-card__accent--planning { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
  .project-card__accent--in_progress { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  .project-card__accent--completed { background: linear-gradient(90deg, #10b981, #34d399); }
  .project-card__accent--on_hold { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

  .project-card__body {
    padding: 20px 20px 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .project-card__top-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 14px;
  }

  .project-card__status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: capitalize;
    flex-shrink: 0;
  }
  .project-card__status-badge--planning {
    background: rgba(148, 163, 184, 0.12);
    color: #64748b;
    border: 1px solid rgba(148, 163, 184, 0.2);
  }
  .dark .project-card__status-badge--planning {
    color: #94a3b8;
  }
  .project-card__status-badge--in_progress {
    background: rgba(59, 130, 246, 0.10);
    color: #2563eb;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  .dark .project-card__status-badge--in_progress {
    color: #60a5fa;
  }
  .project-card__status-badge--completed {
    background: rgba(16, 185, 129, 0.10);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  .dark .project-card__status-badge--completed {
    color: #34d399;
  }
  .project-card__status-badge--on_hold {
    background: rgba(245, 158, 11, 0.10);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }
  .dark .project-card__status-badge--on_hold {
    color: #fbbf24;
  }
  .project-card__status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .project-card__status-dot--planning { background: #94a3b8; }
  .project-card__status-dot--in_progress { background: #3b82f6; animation: pulse-dot 2s infinite; }
  .project-card__status-dot--completed { background: #10b981; }
  .project-card__status-dot--on_hold { background: #f59e0b; }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .project-card__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .project-card:hover .project-card__actions { opacity: 1; }

  .project-card__action-btn {
    width: 30px; height: 30px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }
  .project-card__action-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
  }

  .project-card__title {
    font-size: 16px;
    font-weight: 650;
    color: var(--text-main);
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.4;
    transition: color 0.2s;
  }
  .project-card:hover .project-card__title {
    color: var(--primary);
  }
  .project-card--locked:hover .project-card__title {
    color: var(--text-main);
  }

  .project-card__desc {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 14px;
    min-height: 39px;
  }

  .project-card__meta-row {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .project-card__meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .project-card__meta-item--overdue {
    color: var(--danger);
    font-weight: 600;
  }
  .project-card__category-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--primary);
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.03em;
    opacity: 0.85;
  }

  /* Progress section */
  .project-card__progress {
    margin-top: auto;
    margin-bottom: 16px;
  }
  .project-card__progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 7px;
  }
  .project-card__progress-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .project-card__progress-value {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-main);
  }
  .project-card__progress-track {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: var(--bg);
    overflow: hidden;
  }
  .project-card__progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  }
  .project-card__progress-fill--complete {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  /* Footer */
  .project-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: rgba(0,0,0,0.01);
  }
  .dark .project-card__footer {
    background: rgba(255,255,255,0.01);
  }
  .project-card__footer-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .project-card__footer-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }
  .project-card__member-stack {
    display: flex;
    align-items: center;
  }
  .project-card__member-stack > *:not(:first-child) {
    margin-left: -6px;
  }
  .project-card__member-extra {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: var(--bg);
    border: 2px solid var(--surface);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: var(--text-muted);
    margin-left: -6px;
  }
  .project-card__arrow {
    color: var(--text-muted);
    transition: all 0.2s;
  }
  .project-card:hover .project-card__arrow {
    color: var(--primary);
    transform: translateX(3px);
  }

  /* ── Lock Overlay ── */
  .project-card__lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.02);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 16px;
  }
  .project-card--locked:hover .project-card__lock-overlay {
    opacity: 1;
  }
  .project-card__lock-tooltip {
    padding: 4px 12px;
    border-radius: 8px;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(4px);
    font-size: 11px;
    font-weight: 600;
    color: #fff;
  }

  /* ── Empty State ── */
  .empty-state {
    text-align: center;
    padding: 64px 24px;
    border-radius: 20px;
    background: var(--surface);
    border: 1px dashed var(--border);
  }
  .empty-state__icon-wrap {
    width: 72px; height: 72px;
    border-radius: 20px;
    background: linear-gradient(135deg, var(--primary), var(--primary-hover));
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    box-shadow: 0 8px 24px -6px rgba(79, 70, 229, 0.25);
  }
  .dark .empty-state__icon-wrap {
    box-shadow: 0 8px 24px -6px rgba(129, 140, 248, 0.2);
  }
  .empty-state__title {
    font-size: 18px;
    font-weight: 650;
    color: var(--text-main);
    margin-bottom: 6px;
  }
  .empty-state__desc {
    font-size: 14px;
    color: var(--text-muted);
    max-width: 400px;
    margin: 0 auto 20px;
    line-height: 1.6;
  }

  /* ── Tab Switcher ── */
  .tab-switcher {
    display: inline-flex;
    padding: 3px;
    border-radius: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    gap: 2px;
  }
  .tab-switcher__btn {
    padding: 7px 18px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 9px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--text-muted);
  }
  .tab-switcher__btn:hover {
    color: var(--text-main);
  }
  .tab-switcher__btn--active {
    background: var(--surface);
    color: var(--primary);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .dark .tab-switcher__btn--active {
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  /* ── Page Header ── */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .page-header__title {
    font-size: 26px;
    font-weight: 750;
    color: var(--text-main);
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .page-header__subtitle {
    font-size: 14px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  /* ── Staggered entrance ── */
  .stagger-enter {
    opacity: 0;
    transform: translateY(12px);
    animation: staggerFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes staggerFadeIn {
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Archive Toggle ── */
  .archive-toggle {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    user-select: none;
    padding: 5px 0;
  }
  .archive-toggle input {
    accent-color: var(--primary);
    width: 14px; height: 14px;
    cursor: pointer;
  }

  /* ── Header gradient line ── */
  .header-gradient-line {
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--primary), var(--primary-hover), var(--success));
    width: 60px;
    margin-top: 8px;
  }

  /* ── View Toggle ── */
  .view-toggle {
    display: inline-flex;
    padding: 3px;
    border-radius: 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    gap: 2px;
  }
  .view-toggle__btn {
    width: 34px; height: 34px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
    color: var(--text-muted);
    transition: all 0.2s;
  }
  .view-toggle__btn:hover {
    color: var(--text-main);
  }
  .view-toggle__btn--active {
    background: var(--surface);
    color: var(--primary);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .dark .view-toggle__btn--active {
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  /* ── List View ── */
  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--surface);
  }

  .project-list-header {
    display: grid;
    grid-template-columns: 2fr 120px 140px 110px 100px 140px 48px;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    font-size: 11px;
    font-weight: 650;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  @media (max-width: 1024px) {
    .project-list-header {
      display: none;
    }
  }

  .project-list-item {
    position: relative;
    display: grid;
    grid-template-columns: 2fr 120px 140px 110px 100px 140px 48px;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }
  .project-list-item:last-child {
    border-bottom: none;
  }
  .project-list-item:hover {
    background: rgba(79, 70, 229, 0.02);
  }
  .dark .project-list-item:hover {
    background: rgba(129, 140, 248, 0.03);
  }
  .project-list-item--archived {
    opacity: 0.6;
  }
  .project-list-item--locked {
    cursor: not-allowed;
    filter: grayscale(0.1);
  }
  .project-list-item--locked:hover {
    background: transparent;
  }

  @media (max-width: 1024px) {
    .project-list-item {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 16px 20px;
    }
  }

  .list-item__name-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .list-item__accent-bar {
    width: 3px;
    height: 36px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .list-item__accent-bar--planning { background: #94a3b8; }
  .list-item__accent-bar--in_progress { background: #3b82f6; }
  .list-item__accent-bar--completed { background: #10b981; }
  .list-item__accent-bar--on_hold { background: #f59e0b; }

  .list-item__name-wrap {
    min-width: 0;
    flex: 1;
  }
  .list-item__name {
    font-size: 14px;
    font-weight: 620;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .project-list-item:hover .list-item__name {
    color: var(--primary);
  }
  .project-list-item--locked:hover .list-item__name {
    color: var(--text-main);
  }
  .list-item__desc {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  .list-item__progress-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .list-item__progress-track {
    flex: 1;
    height: 5px;
    border-radius: 999px;
    background: var(--bg);
    overflow: hidden;
    min-width: 50px;
  }
  .list-item__progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--primary), var(--primary-hover));
    transition: width 0.6s ease;
  }
  .list-item__progress-fill--complete {
    background: linear-gradient(90deg, #10b981, #34d399);
  }
  .list-item__progress-text {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-main);
    min-width: 32px;
    text-align: right;
  }

  .list-item__deadline-cell {
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .list-item__deadline-cell--overdue {
    color: var(--danger);
    font-weight: 600;
  }

  .list-item__tasks-cell {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .list-item__members-cell {
    display: flex;
    align-items: center;
  }
  .list-item__members-cell > *:not(:first-child) {
    margin-left: -5px;
  }
  .list-item__member-extra {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: var(--bg);
    border: 2px solid var(--surface);
    display: flex; align-items: center; justify-content: center;
    font-size: 8px;
    font-weight: 700;
    color: var(--text-muted);
    margin-left: -5px;
  }

  .list-item__arrow-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    transition: all 0.2s;
  }
  .project-list-item:hover .list-item__arrow-cell {
    color: var(--primary);
    transform: translateX(2px);
  }

  .list-item__actions {
    opacity: 0;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
  }
  .project-list-item:hover .list-item__actions {
    opacity: 1;
  }

  .list-item__lock-badge {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    padding: 3px 10px;
    border-radius: 6px;
    background: rgba(0,0,0,0.06);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .dark .list-item__lock-badge {
    background: rgba(255,255,255,0.06);
  }
  .project-list-item--locked:hover .list-item__lock-badge {
    opacity: 1;
  }

  /* ── Status Dropdown ── */
  .status-dropdown-wrapper {
    position: relative;
    display: inline-flex;
  }
  .status-dropdown-trigger {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: capitalize;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
    background: none;
    line-height: 1.4;
  }
  .status-dropdown-trigger:hover {
    filter: brightness(0.92);
    transform: scale(1.02);
  }
  .status-dropdown-trigger--open {
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.18);
  }

  /* Portal-based floating menu */
  .status-dropdown-portal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
  }
  .status-dropdown-portal-menu {
    position: fixed;
    min-width: 180px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 16px 48px -12px rgba(0,0,0,0.15), 0 4px 16px -4px rgba(0,0,0,0.08);
    padding: 5px;
    z-index: 9999;
    opacity: 0;
    transform: scale(0.97);
    animation: statusDropIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .dark .status-dropdown-portal-menu {
    box-shadow: 0 16px 48px -12px rgba(0,0,0,0.5), 0 4px 16px -4px rgba(0,0,0,0.4);
  }
  @keyframes statusDropIn {
    to { opacity: 1; transform: scale(1); }
  }

  .status-dropdown-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 12px;
    border: none;
    background: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-main);
    cursor: pointer;
    transition: all 0.12s;
    text-align: left;
  }
  .status-dropdown-option:hover {
    background: var(--bg);
  }
  .status-dropdown-option--active {
    background: rgba(79, 70, 229, 0.08);
    font-weight: 600;
  }
  .dark .status-dropdown-option--active {
    background: rgba(129, 140, 248, 0.1);
  }
  .status-dropdown-option__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px rgba(0,0,0,0.05);
  }
  .status-dropdown-option__dot--pulse {
    animation: statusPulse 1.8s infinite;
  }
  @keyframes statusPulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
    70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }
  .status-dropdown-option__label {
    flex: 1;
  }
  .status-dropdown-option__check {
    margin-left: auto;
    font-size: 14px;
    color: var(--primary);
    font-weight: 700;
    line-height: 1;
  }

  /* Responsive list labels */
  .list-item__mobile-label {
    display: none;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }
  @media (max-width: 1024px) {
    .list-item__mobile-label {
      display: block;
    }
  }
`;

/* ─── Schema ─── */

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  startDate: z.string().min(1, 'Start date is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']),
  memberIds: z.array(z.string()).optional(),
  templateId: z.string().optional(),
  clientId: z.string().optional(),
  departmentId: z.string().optional(),
  otherDepartmentIds: z.array(z.string()).optional(),
  projectManagerId: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.deadline) {
    return new Date(data.deadline) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "Deadline cannot be before start date",
  path: ["deadline"],
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

/* ─── Helpers ─── */

function getDeadlineInfo(deadline: string | null) {
  if (!deadline) return { label: 'No deadline', isOverdue: false, isSoon: false };
  const now = new Date();
  const dl = new Date(deadline);
  const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isSoon: false };
  if (diffDays === 0) return { label: 'Due today', isOverdue: false, isSoon: true };
  if (diffDays <= 3) return { label: `${diffDays}d left`, isOverdue: false, isSoon: true };
  if (diffDays <= 7) return { label: `${diffDays}d left`, isOverdue: false, isSoon: false };
  return { label: dl.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false, isSoon: false };
}

/** Resolve label/color from the centralized workflow config */
function getProjectStatusInfo(status: string) {
  const config = PROJECT_STATUS_CONFIG[status as ProjectStatusValue];
  return {
    label: config?.label || status.replace('_', ' '),
    color: config?.color || '#94a3b8',
  };
}

/* ─── Status Dropdown Component ─── */

interface StatusDropdownProps {
  projectId: string;
  currentStatus: string;
  canEdit: boolean;
  onStatusChange: (projectId: string, newStatus: string) => void;
  compact?: boolean;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ projectId, currentStatus, canEdit, onStatusChange, compact }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Calculate portal position on open
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = 200; // approximate max height
    const menuWidth = 180;
    const viewH = window.innerHeight;
    const viewW = window.innerWidth;

    // Prefer below, flip above if not enough space
    let top = rect.bottom + 6;
    if (top + menuHeight > viewH - 12) {
      top = rect.top - menuHeight - 6;
      if (top < 12) top = 12; // absolute safety
    }

    // Prefer left-aligned, shift if overflowing right
    let left = rect.left;
    if (left + menuWidth > viewW - 12) {
      left = viewW - menuWidth - 12;
    }
    if (left < 12) left = 12;

    setMenuPos({ top, left });
  }, [isOpen]);

  const handleSelect = useCallback((newStatus: string) => {
    if (newStatus !== currentStatus) {
      onStatusChange(projectId, newStatus);
    }
    setIsOpen(false);
  }, [projectId, currentStatus, onStatusChange]);

  const info = getProjectStatusInfo(currentStatus);

  // Read-only badge for employees
  if (!canEdit) {
    return (
      <span
        className="status-dropdown-trigger"
        style={{
          background: `${info.color}15`,
          color: info.color,
          borderColor: `${info.color}30`,
          cursor: 'default',
        }}
      >
        <span 
          className={`status-dropdown-option__dot ${currentStatus === 'in_progress' ? 'status-dropdown-option__dot--pulse' : ''}`} 
          style={{ background: info.color }} 
        />
        {info.label}
      </span>
    );
  }

  return (
    <div className="status-dropdown-wrapper">
      <button
        ref={triggerRef}
        className={`status-dropdown-trigger ${isOpen ? 'status-dropdown-trigger--open' : ''}`}
        style={{
          background: `${info.color}15`,
          color: info.color,
          borderColor: `${info.color}30`,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Change status"
      >
        <span 
          className={`status-dropdown-option__dot ${currentStatus === 'in_progress' ? 'status-dropdown-option__dot--pulse' : ''}`} 
          style={{ background: info.color }} 
        />
        {info.label}
        <ChevronDown size={compact ? 10 : 12} style={{ opacity: 0.6, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && ReactDOM.createPortal(
        <>
          <div
            className="status-dropdown-portal-overlay"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }}
          />
          <div
            ref={menuRef}
            className="status-dropdown-portal-menu"
            style={menuPos ? { top: menuPos.top, left: menuPos.left } : { top: 0, left: -9999 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {PROJECT_STATUS_OPTIONS.map((s) => {
              const isActive = s.value === currentStatus;
              return (
                <button
                  key={s.value}
                  className={`status-dropdown-option ${isActive ? 'status-dropdown-option--active' : ''}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(s.value); }}
                >
                  <span 
                    className={`status-dropdown-option__dot ${s.value === 'in_progress' ? 'status-dropdown-option__dot--pulse' : ''}`} 
                    style={{ background: s.color }} 
                  />
                  <span className="status-dropdown-option__label">{s.label}</span>
                  {isActive && <span className="status-dropdown-option__check">✓</span>}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

/* ─── Component ─── */

const ProjectsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, categories, isLoading } = useAppSelector((state) => state.projects);
  const { users } = useAppSelector((state) => state.users);
  const { templates } = useAppSelector((state) => state.templates);
  const { clients } = useAppSelector((state) => state.clients);
  const { departments } = useAppSelector((state) => state.departments);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const isAdminOrSuper = isAdminOrManager(currentUser?.role);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (sessionStorage.getItem('projects_view_mode') as 'grid' | 'list') || 'grid');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; project: Project } | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState(sessionStorage.getItem('projects_filter_search') || '');
  const [statusFilter, setStatusFilter] = useState(sessionStorage.getItem('projects_filter_status') || '');
  const [categoryFilter, setCategoryFilter] = useState(sessionStorage.getItem('projects_filter_category') || '');
  const [managerFilter, setManagerFilter] = useState(sessionStorage.getItem('projects_filter_manager') || '');
  const [deadlineFilter, setDeadlineFilter] = useState(sessionStorage.getItem('projects_filter_deadline') || '');
  const [showArchived, setShowArchived] = useState(sessionStorage.getItem('projects_filter_archived') === 'true');

  useEffect(() => {
    sessionStorage.setItem('projects_filter_search', searchTerm);
    sessionStorage.setItem('projects_filter_status', statusFilter);
    sessionStorage.setItem('projects_filter_category', categoryFilter);
    sessionStorage.setItem('projects_filter_manager', managerFilter);
    sessionStorage.setItem('projects_filter_deadline', deadlineFilter);
    sessionStorage.setItem('projects_filter_archived', showArchived.toString());
    sessionStorage.setItem('projects_view_mode', viewMode);
  }, [searchTerm, statusFilter, categoryFilter, managerFilter, deadlineFilter, showArchived, viewMode]);

  useEffect(() => {
    dispatch(fetchCategories());
    if (isAdminOrSuper) {
      dispatch(fetchTemplates());
      dispatch(fetchClients());
      dispatch(fetchDepartments());
    }
  }, [dispatch, isAdminOrSuper]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchProjects({
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
        isArchived: showArchived,
        managerId: managerFilter,
        deadline: deadlineFilter
      }));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, searchTerm, statusFilter, categoryFilter, showArchived]);

  useEffect(() => {
    if (isAdminOrManager(currentUser?.role)) {
      dispatch(fetchUsers());
    }
  }, [dispatch, currentUser?.role]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '', description: '', category: '',
      startDate: '', deadline: '', memberIds: [],
      otherDepartmentIds: [], status: 'planning',
      templateId: '', clientId: '', departmentId: '',
      projectManagerId: currentUser?.id || ''
    },
  });

  const selectedDeptId = watch('departmentId');

  useEffect(() => {
    if (selectedDeptId) {
      const dept = departments.find(d => d.id === selectedDeptId);
      if (dept?.managerId) {
        setValue('projectManagerId', dept.managerId);
      }
    }
  }, [selectedDeptId, departments, setValue]);

  const onSubmitCreate = async (data: CreateProjectForm) => {
    const action = await dispatch(createProject({ ...data, memberIds: data.memberIds || [] }));
    if (createProject.fulfilled.match(action)) {
      setIsCreateModalOpen(false);
      reset();
      toast.success('Project created successfully');
    } else {
      toast.error('Failed to create project');
    }
  };

  const handleDelete = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, project });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await dispatch(deleteProject(deleteConfirm.project.id)).unwrap();
      toast.success(`Project "${deleteConfirm.project.name}" deleted`);
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = useCallback(async (projectId: string, newStatus: string) => {
    try {
      await dispatch(updateProject({ id: projectId, data: { status: newStatus as Project['status'] } })).unwrap();
      toast.success(`Status updated to ${getProjectStatusInfo(newStatus).label}`);
    } catch {
      toast.error('Failed to update status');
    }
  }, [dispatch]);

  // Stats
  const stats = useMemo(() => {
    const counts = { planning: 0, in_progress: 0, completed: 0, on_hold: 0 };
    projects.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return { total: projects.length, ...counts };
  }, [projects]);

  // Active filters for pills
  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; color: string; onClear: () => void }[] = [];
    if (statusFilter) {
      const colors: Record<string, string> = { planning: '#94a3b8', in_progress: '#3b82f6', completed: '#10b981', on_hold: '#f59e0b' };
      filters.push({ key: 'status', label: statusLabel[statusFilter] || statusFilter, color: colors[statusFilter] || '#94a3b8', onClear: () => setStatusFilter('') });
    }
    if (categoryFilter) {
      filters.push({ key: 'category', label: categoryFilter, color: 'var(--primary)', onClear: () => setCategoryFilter('') });
    }
    if (managerFilter) {
      const manager = users.find(u => u.id === managerFilter);
      filters.push({ key: 'manager', label: manager?.name || 'Manager', color: '#8b5cf6', onClear: () => setManagerFilter('') });
    }
    if (deadlineFilter) {
      const deadlineLabels: Record<string, string> = { today: 'Due Today', 'this-week': 'Due This Week', overdue: 'Overdue' };
      filters.push({ key: 'deadline', label: deadlineLabels[deadlineFilter] || deadlineFilter, color: '#ef4444', onClear: () => setDeadlineFilter('') });
    }
    return filters;
  }, [statusFilter, categoryFilter, managerFilter, deadlineFilter, users]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => activeTab === 'all' || p.isMember || p.ownerId === currentUser?.id || isAdminOrSuper);
  }, [projects, activeTab, currentUser?.id, isAdminOrSuper]);

  return (
    <>
      <style>{styles}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'left' }}>

        {/* ── Page Header ── */}
        <div className="page-header stagger-enter" style={{ animationDelay: '0ms' }}>
          <div>
            <h1 className="page-header__title">
              {isAdminOrManager(currentUser?.role) ? 'All Projects' : 'My Projects'}
            </h1>
            <p className="page-header__subtitle">
              Track progress, manage deadlines, and collaborate with your team.
            </p>
            <div className="header-gradient-line" />
          </div>
          {!isEmployee(currentUser?.role) && (
            <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
              New Project
            </Button>
          )}
        </div>

        {/* ── Stats Cards ── */}
        <div className="projects-stats-grid stagger-enter" style={{ animationDelay: '60ms' }}>
          {[
            { key: 'total', label: 'Total', value: stats.total, icon: <Layers size={17} />, bg: 'var(--primary)', bgAlpha: 'rgba(79,70,229,0.1)' },
            { key: 'in_progress', label: 'Active', value: stats.in_progress, icon: <TrendingUp size={17} />, bg: '#3b82f6', bgAlpha: 'rgba(59,130,246,0.1)' },
            { key: 'planning', label: 'Planning', value: stats.planning, icon: <Clock size={17} />, bg: '#94a3b8', bgAlpha: 'rgba(148,163,184,0.1)' },
            { key: 'completed', label: 'Completed', value: stats.completed, icon: <CheckSquare size={17} />, bg: '#10b981', bgAlpha: 'rgba(16,185,129,0.1)' },
            { key: 'on_hold', label: 'On Hold', value: stats.on_hold, icon: <BarChart3 size={17} />, bg: '#f59e0b', bgAlpha: 'rgba(245,158,11,0.1)' },
          ].map((s) => (
            <div key={s.key} className={`stat-card stat-card--${s.key}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-card__icon" style={{ background: s.bgAlpha, color: s.bg }}>
                  {s.icon}
                </div>
                <span className="stat-card__value">{s.value}</span>
              </div>
              <span className="stat-card__label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Tabs + Filter Bar ── */}
        <div className="stagger-enter" style={{ animationDelay: '120ms', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div className="tab-switcher">
              <button
                className={`tab-switcher__btn ${activeTab === 'my' ? 'tab-switcher__btn--active' : ''}`}
                onClick={() => setActiveTab('my')}
              >
                My Projects
              </button>
              <button
                className={`tab-switcher__btn ${activeTab === 'all' ? 'tab-switcher__btn--active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Projects
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="view-toggle">
                <button
                  className={`view-toggle__btn ${viewMode === 'grid' ? 'view-toggle__btn--active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  className={`view-toggle__btn ${viewMode === 'list' ? 'view-toggle__btn--active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>

              <label className="archive-toggle">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                Show Archived
              </label>
            </div>
          </div>

          <div className="filter-bar">
            <div className="filter-bar__search">
              <SearchIcon size={16} className="filter-bar__search-icon" />
              <input
                type="text"
                placeholder="Search projects by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'planning', label: 'Planning', color: '#94a3b8' },
                { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
                { value: 'completed', label: 'Completed', color: '#10b981' },
                { value: 'on_hold', label: 'On Hold', color: '#f59e0b' },
              ]}
              className="w-40"
            />

            <CustomSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat, label: cat }))
              ]}
              className="w-40"
            />

            {isAdminOrSuper && (
              <CustomSelect
                value={managerFilter}
                onChange={setManagerFilter}
                options={[
                  { value: '', label: 'All Managers' },
                  ...users.filter(u => u.isActive && isAdminOrManager(u.role)).map(u => ({ value: u.id, label: u.name }))
                ]}
                className="w-44"
              />
            )}

            <CustomSelect
              value={deadlineFilter}
              onChange={setDeadlineFilter}
              options={[
                { value: '', label: 'All Deadlines' },
                { value: 'today', label: 'Due Today' },
                { value: 'this-week', label: 'Due This Week' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              className="w-40"
            />
          </div>

          {/* Active filter pills */}
          {activeFilters.length > 0 && (
            <div className="active-filters">
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Filter size={12} /> Filters:
              </span>
              {activeFilters.map((f) => (
                <button key={f.key} className="active-filter-pill" onClick={f.onClear} title="Click to remove">
                  <span className="active-filter-pill__dot" style={{ background: f.color }} />
                  {f.label}
                  <X size={10} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {isLoading && projects.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state stagger-enter" style={{ animationDelay: '180ms' }}>
            <div className="empty-state__icon-wrap">
              <FolderKanban size={32} style={{ color: '#fff' }} />
            </div>
            <h3 className="empty-state__title">No projects found</h3>
            <p className="empty-state__desc">
              {!isEmployee(currentUser?.role)
                ? 'Get started by creating your first project, or try adjusting your filters.'
                : "You haven't been assigned to any projects matching these filters."}
            </p>
            {!isEmployee(currentUser?.role) && !searchTerm && !statusFilter && !categoryFilter && !showArchived && (
              <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={16} />}>
                Create Your First Project
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ════ GRID VIEW ════ */
          <div className="projects-grid">
            {filteredProjects.map((project, index) => {
              const hasAccess = project.isMember || project.ownerId === currentUser?.id || isAdminOrSuper;
              const deadline = getDeadlineInfo(project.deadline);
              const visibleMembers = (project.members || []).slice(0, 4);
              const extraMembers = (project.members?.length || 0) - 4;

              const cardContent = (
                <div
                  className={`project-card stagger-enter ${project.isArchived ? 'project-card--archived' : ''} ${!hasAccess ? 'project-card--locked' : ''}`}
                  style={{ animationDelay: `${180 + index * 50}ms` }}
                >
                  {/* Accent bar */}
                  <div className={`project-card__accent project-card__accent--${project.status}`} />

                  {/* Body */}
                  <div className="project-card__body">
                    {/* Top row: status + actions */}
                    <div className="project-card__top-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <StatusDropdown
                          projectId={project.id}
                          currentStatus={project.status}
                          canEdit={hasAccess && !isEmployee(currentUser?.role)}
                          onStatusChange={handleStatusChange}
                        />
                        {project.isArchived && (
                          <Badge variant="gray" className="text-[10px] px-1.5 py-0 h-4">Archived</Badge>
                        )}
                        {!hasAccess && <Lock size={13} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                      <div className="project-card__actions">
                        {isAdminOrSuper && (
                          <button
                            className="project-card__action-btn"
                            onClick={(e) => handleDelete(e, project)}
                            title="Delete Project"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title + description */}
                    <h3 className="project-card__title">
                      {project.name}
                    </h3>
                    <p className="project-card__desc">
                      {project.description || 'No description provided.'}
                    </p>

                    {/* Meta row */}
                    <div className="project-card__meta-row">
                      {project.category && (
                        <span className="project-card__category-chip">{project.category}</span>
                      )}
                      <span className={`project-card__meta-item ${deadline.isOverdue ? 'project-card__meta-item--overdue' : ''}`}>
                        <Calendar size={12} />
                        {deadline.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="project-card__progress">
                      <div className="project-card__progress-header">
                        <span className="project-card__progress-label">Progress</span>
                        <span className="project-card__progress-value">{project.progress}%</span>
                      </div>
                      <div className="project-card__progress-track">
                        <div
                          className={`project-card__progress-fill ${project.progress === 100 ? 'project-card__progress-fill--complete' : ''}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="project-card__footer">
                    <div className="project-card__footer-left">
                      <span className="project-card__footer-stat">
                        <CheckSquare size={13} />
                        {project.completedTasks}/{project.totalTasks}
                      </span>
                      <div className="project-card__member-stack">
                        {visibleMembers.map((m) => (
                          <Avatar
                            key={m.userId}
                            name={m.user.name}
                            color={m.user.avatarColor}
                            size={24}
                            style={{ border: '2px solid var(--surface)' }}
                          />
                        ))}
                        {extraMembers > 0 && (
                          <span className="project-card__member-extra">+{extraMembers}</span>
                        )}
                      </div>
                    </div>
                    {hasAccess && <ArrowRight size={16} className="project-card__arrow" />}
                  </div>

                  {/* Lock overlay for no-access */}
                  {!hasAccess && (
                    <div className="project-card__lock-overlay">
                      <span className="project-card__lock-tooltip">No Member Access</span>
                    </div>
                  )}
                </div>
              );

              return hasAccess ? (
                <Link key={project.id} to={`/pm/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {cardContent}
                </Link>
              ) : (
                <div key={project.id}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        ) : (
          /* ════ LIST VIEW ════ */
          <div className="projects-list stagger-enter" style={{ animationDelay: '180ms' }}>
            {/* Table Header */}
            <div className="project-list-header">
              <span>Project</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Deadline</span>
              <span>Tasks</span>
              <span>Team</span>
              <span></span>
            </div>

            {/* Rows */}
            {filteredProjects.map((project, index) => {
              const hasAccess = project.isMember || project.ownerId === currentUser?.id || isAdminOrSuper;
              const deadline = getDeadlineInfo(project.deadline);
              const visibleMembers = (project.members || []).slice(0, 5);
              const extraMembers = (project.members?.length || 0) - 5;

              const rowContent = (
                <div
                  className={`project-list-item stagger-enter ${project.isArchived ? 'project-list-item--archived' : ''} ${!hasAccess ? 'project-list-item--locked' : ''}`}
                  style={{ animationDelay: `${180 + index * 30}ms` }}
                >
                  {/* Name Cell */}
                  <div className="list-item__name-cell">
                    <div className={`list-item__accent-bar list-item__accent-bar--${project.status}`} />
                    <div className="list-item__name-wrap">
                      <p className="list-item__name">
                        {project.name}
                        {project.isArchived && <Badge variant="gray" className="text-[10px] px-1.5 py-0 h-4">Archived</Badge>}
                        {!hasAccess && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
                      </p>
                      <p className="list-item__desc">
                        {project.description || 'No description'}
                        {project.category && <> · <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{project.category}</span></>}
                      </p>
                    </div>
                  </div>

                  {/* Status Cell */}
                  <div>
                    <span className="list-item__mobile-label">Status</span>
                    <StatusDropdown
                      projectId={project.id}
                      currentStatus={project.status}
                      canEdit={hasAccess && !isEmployee(currentUser?.role)}
                      onStatusChange={handleStatusChange}
                      compact
                    />
                  </div>

                  {/* Progress Cell */}
                  <div>
                    <span className="list-item__mobile-label">Progress</span>
                    <div className="list-item__progress-cell">
                      <div className="list-item__progress-track">
                        <div
                          className={`list-item__progress-fill ${project.progress === 100 ? 'list-item__progress-fill--complete' : ''}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="list-item__progress-text">{project.progress}%</span>
                    </div>
                  </div>

                  {/* Deadline Cell */}
                  <div>
                    <span className="list-item__mobile-label">Deadline</span>
                    <span className={`list-item__deadline-cell ${deadline.isOverdue ? 'list-item__deadline-cell--overdue' : ''}`}>
                      <Calendar size={12} />
                      {deadline.label}
                    </span>
                  </div>

                  {/* Tasks Cell */}
                  <div>
                    <span className="list-item__mobile-label">Tasks</span>
                    <span className="list-item__tasks-cell">
                      <CheckSquare size={12} />
                      {project.completedTasks}/{project.totalTasks}
                    </span>
                  </div>

                  {/* Members Cell */}
                  <div>
                    <span className="list-item__mobile-label">Team</span>
                    <div className="list-item__members-cell">
                      {visibleMembers.map((m) => (
                        <Avatar
                          key={m.userId}
                          name={m.user.name}
                          color={m.user.avatarColor}
                          size={22}
                          style={{ border: '2px solid var(--surface)' }}
                        />
                      ))}
                      {extraMembers > 0 && (
                        <span className="list-item__member-extra">+{extraMembers}</span>
                      )}
                      {(project.members?.length || 0) === 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow / Action Cell */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {isAdminOrSuper && (
                      <div className="list-item__actions">
                        <button
                          className="project-card__action-btn"
                          onClick={(e) => handleDelete(e, project)}
                          title="Delete Project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    {hasAccess && (
                      <span className="list-item__arrow-cell">
                        <ArrowRight size={15} />
                      </span>
                    )}
                  </div>

                  {/* Lock badge */}
                  {!hasAccess && (
                    <span className="list-item__lock-badge">No Access</span>
                  )}
                </div>
              );

              return hasAccess ? (
                <Link key={project.id} to={`/pm/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'contents' }}>
                  {rowContent}
                </Link>
              ) : (
                <div key={project.id} style={{ display: 'contents' }}>
                  {rowContent}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Create Modal ── */}
        {!isEmployee(currentUser?.role) && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              reset();
            }}
            title="Create New Project"
          >
            <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4 text-left">
              <Input
                label="Project Name*"
                placeholder="e.g., Website Redesign"
                {...register('name')}
                error={errors.name?.message}
              />

              <Input
                label="Category*"
                placeholder="e.g., Marketing, Development"
                {...register('category')}
                error={errors.category?.message}
              />

              {isAdminOrSuper && templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">Project Template (Optional)</label>
                  <select
                    {...register('templateId')}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => {
                      register('templateId').onChange(e);
                      const tmpl = templates.find((t) => t.id === e.target.value);
                      if (tmpl) {
                        reset({
                          ...getValues(),
                          name: tmpl.name,
                          description: tmpl.description || '',
                          category: tmpl.category || '',
                          templateId: tmpl.id,
                        });
                      }
                    }}
                  >
                    <option value="">Start from scratch</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-text-muted">Selecting a template will populate tasks and milestones.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Description</label>
                <textarea
                  {...register('description')}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Briefly describe what this project is about..."
                />
              </div>

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    label="Initial Status"
                    options={[
                      { value: 'planning', label: 'Planning', color: '#94a3b8' },
                      { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
                      { value: 'completed', label: 'Completed', color: '#10b981' },
                      { value: 'on_hold', label: 'On Hold', color: '#f59e0b' },
                    ]}
                    value={field.value || 'planning'}
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Start Date*"
                  {...register('startDate')}
                  error={errors.startDate?.message}
                />
                <Input
                  type="date"
                  label="Deadline*"
                  {...register('deadline')}
                  error={errors.deadline?.message}
                />
              </div>

              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    label="Assign to Client (Optional)"
                    options={[{ value: '', label: '-- No Client --' }, ...clients.map(c => ({ value: c.id, label: c.name }))]}
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Primary Department (Optional)"
                      options={[{ value: '', label: '-- Independent --' }, ...departments.map(d => ({ value: d.id, label: d.name, color: d.color }))]}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  name="projectManagerId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Project Manager"
                      options={[
                        { value: currentUser?.id || '', label: `Me (${currentUser?.name})` },
                        ...users.filter(u => u.isActive && u.id !== currentUser?.id && (u.role === 'admin' || u.role === 'manager')).map(u => ({ value: u.id, label: u.name }))
                      ]}
                      value={field.value || currentUser?.id || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Additional Departments (Auto-assign all users)</label>
                <Controller
                  name="otherDepartmentIds"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2 p-2 border border-border rounded-lg bg-background min-h-[42px]">
                      {departments.map(dept => (
                        <label key={dept.id} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={field.value?.includes(dept.id)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...(field.value || []), dept.id]
                                : (field.value || []).filter(id => id !== dept.id);
                              field.onChange(updated);
                            }}
                          />
                          <Badge
                            variant="gray"
                            className={`cursor-pointer transition-all ${field.value?.includes(dept.id) ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: field.value?.includes(dept.id) ? dept.color : undefined, color: field.value?.includes(dept.id) ? 'white' : undefined }}
                          >
                            {dept.name}
                          </Badge>
                        </label>
                      ))}
                      {departments.length === 0 && <span className="text-xs text-text-muted">No departments available</span>}
                    </div>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Assign Additional Members</label>
                <Controller
                  name="memberIds"
                  control={control}
                  render={({ field }) => (
                    <div className="border border-border rounded-lg max-h-48 overflow-y-auto bg-background p-2 space-y-1">
                      {users
                        .filter((u) => u.isActive && u.id !== currentUser?.id)
                        .map((user) => (
                          <label key={user.id} className="flex items-center p-2 hover:bg-surface rounded-md cursor-pointer transition-colors border border-transparent hover:border-border">
                            <input
                              type="checkbox"
                              className="rounded border-border text-primary focus:ring-primary w-4 h-4 mr-3"
                              checked={field.value?.includes(user.id)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...(field.value || []), user.id]
                                  : (field.value || []).filter((id) => id !== user.id);
                                field.onChange(updated);
                              }}
                            />
                            <Avatar name={user.name} color={user.avatarColor} size={24} />
                            <span className="ml-2 text-sm text-text-main">{user.name}</span>
                          </label>
                        ))}
                      {users.filter((u) => u.isActive && u.id !== currentUser?.id).length === 0 && (
                        <p className="text-sm text-text-muted p-2 text-center">No other active users available.</p>
                      )}
                    </div>
                  )}
                />
                <p className="mt-1 text-xs text-text-muted">You act as the manager and are automatically included.</p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create Project
                </Button>
              </div>
            </form>
          </Modal>
        )}

        <ConfirmDialog
          isOpen={deleteConfirm?.isOpen || false}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={executeDelete}
          title="Delete Project"
          message={`Are you sure you want to delete the project "${deleteConfirm?.project.name}"? This action cannot be undone.`}
          confirmText="Delete"
        />
      </div>
    </>
  );
};

export default ProjectsPage;
