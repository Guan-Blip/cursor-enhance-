// ==UserScript==
// @name         游标
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  30项功能 · 三语切换 · 瞬开瞬关
// @author       Guan-Blip
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================================
    // 0. 多语言字典（已内置更新日志占位）
    // ==========================================================
    const LANG = {
        zh: {
            panelTitle: '游标',
            footer: '全部默认关闭 · 刷新即复原',
            close: '✕',
            reset: '🔄 重置',
            enableAll: '✅ 全部开启',
            disableAll: '❌ 全部关闭',
            groupOn: '🔘 全开本组',
            settings: '⚙️ 设置',
            changelog: '📋 更新日志',
            modules: {
                '📖 阅读体感': ['沉浸阅读', '进度条', '平滑滚动', '段落高亮', '图片预览', '禁止拖拽', '代码等宽'],
                '⌨️ 输入辅助': ['邮箱补全', '符号替换', '一键清空', '发光边框', 'Tab缩进', '复制净化', '一键全选'],
                '🎬 视频控制': ['全局倍速', '静音切换', '循环开关', '隐藏控件'],
                '🧰 页面工具': ['返回顶部', '滚动到底部', '临时便签', '关闭弹窗', '元素隐藏', '灰度模式', '隐藏滚动条', '加载提示']
            },
            changelog_list: [
                'v1.0 · 2026-08-07: 初始版本发布，包含30项核心功能，支持中/英/日三语。',
                'v2.0 · 待发布: 这里写未来的更新内容。'
            ]
        },
        en: {
            panelTitle: 'Cursor',
            footer: 'Off by default · Reset on refresh',
            close: '✕',
            reset: '🔄 Reset',
            enableAll: '✅ Enable All',
            disableAll: '❌ Disable All',
            groupOn: '🔘 Enable Group',
            settings: '⚙️ Settings',
            changelog: '📋 Changelog',
            modules: {
                '📖 Reading': ['Reader Mode', 'Progress Bar', 'Smooth Scroll', 'Highlight', 'Image Preview', 'No Drag', 'Code Font'],
                '⌨️ Input': ['Email Fill', 'Symbol Replace', 'Clear Input', 'Glow Border', 'Tab Indent', 'Clean Copy', 'Select All'],
                '🎬 Video': ['Speed Ctrl', 'Mute Toggle', 'Loop Toggle', 'Hide Controls'],
                '🧰 Tools': ['Back Top', 'Go Bottom', 'Temp Note', 'Close Popup', 'Hide Elements', 'Gray Mode', 'Hide Scrollbar', 'Ready Toast']
            },
            changelog_list: [
                'v1.0 · 2026-08-07: Initial release with 30 core features, supports Chinese/English/Japanese.',
                'v2.0 · TBD: Future update details go here.'
            ]
        },
        ja: {
            panelTitle: 'カーソル',
            footer: 'デフォルト無効 · 更新でリセット',
            close: '✕',
            reset: '🔄 リセット',
            enableAll: '✅ 全て有効',
            disableAll: '❌ 全て無効',
            groupOn: '🔘 グループ有効',
            settings: '⚙️ 設定',
            changelog: '📋 更新履歴',
            modules: {
                '📖 読書': ['没入読書', '進捗バー', 'スムーズ', 'ハイライト', '画像プレビュー', 'ドラッグ防止', 'コード等幅'],
                '⌨️ 入力': ['メール補完', '記号置換', 'クリア', '発光枠', 'Tab', 'コピー浄化', '全選択'],
                '🎬 ビデオ': ['倍速', 'ミュート', 'ループ', 'コントロール非表示'],
                '🧰 ツール': ['トップへ', 'ボトムへ', 'メモ', 'ポップアップ', '非表示', 'グレー', 'スクロール非表示', '準備完了']
            },
            changelog_list: [
                'v1.0 · 2026-08-07: 初期リリース、30のコア機能、中国語/英語/日本語対応。',
                'v2.0 · 未定: 将来のアップデート内容をここに記載。'
            ]
        }
    };

    let currentLang = 'zh';
    try {
        const saved = localStorage.getItem('cursor_lang');
        if (saved && ['zh', 'en', 'ja'].includes(saved)) currentLang = saved;
    } catch (_) {}

    // ==========================================================
    // 1. 配置引擎 (已修复 undefined)
    // ==========================================================
    const cfg = {
        reading: false, progress: false, smooth: false, highlight: false,
        preview: false, noDrag: false, codeFont: false,
        email: false, symbol: false, clearInput: false, glow: false,
        tabIndent: false, cleanCopy: false, selectAll: false,
        speed: false, mute: false, loop: false, hideCtrl: false,
        goTop: false, goBottom: false, note: false, closePopup: false,
        clickHide: false, grayMode: false, hideScrollbar: false, pageReady: false
    };

    function loadCfg() {
        for (const k in cfg) {
            try {
                const v = JSON.parse(localStorage.getItem('cursor_30_' + k));
                if (v !== null) cfg[k] = v;
            } catch (_) {}
        }
    }
    function saveCfg(k) {
        localStorage.setItem('cursor_30_' + k, JSON.stringify(cfg[k]));
    }
    loadCfg();

    // ==========================================================
    // 2. 面板UI及骨架（加入了设置入口占位）
    // ==========================================================
    GM_addStyle(`
        #cursor-panel {
            position: fixed; top: 80px; right: 24px; z-index: 999998;
            width: 360px; padding: 20px 22px;
            background: rgba(20,20,30,0.92); backdrop-filter: blur(20px);
            border-radius: 24px; border: 1px solid rgba(255,255,255,0.03);
            box-shadow: 0 24px 64px rgba(0,0,0,0.5);
            color: #eaeef5; font-family: system-ui, sans-serif; font-size: 13px;
            user-select: none; max-height: 90vh; overflow-y: auto;
            transition: width 0.3s ease, padding 0.3s ease, border-radius 0.3s ease;
        }
        #cursor-panel.collapsed {
            width: 56px; height: 56px; padding: 0; border-radius: 28px;
            overflow: hidden; cursor: pointer; display: flex;
            align-items: center; justify-content: center;
        }
        #cursor-panel.collapsed #cursor-body { display: none; }
        #cursor-panel.collapsed #cursor-header { display: none; }
        #cursor-panel.collapsed .cursor-collapsed-icon { display: flex; font-size: 24px; color: #a78bfa; }

        .cursor-collapsed-icon { display: none; }

        #cursor-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 14px; cursor: move;
        }
        #cursor-header h3 { margin: 0; font-size: 16px; font-weight: 500; color: #a78bfa; display: flex; align-items: center; gap: 6px; }
        #cursor-header h3 small { font-size: 10px; color: #7f8fa3; font-weight: 400; }
        #cursor-header .header-actions { display: flex; gap: 2px; }
        #cursor-header .header-actions span {
            cursor: pointer; color: #8899bb; font-size: 16px;
            width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
            border-radius: 50%; transition: 0.2s; background: rgba(255,255,255,0.02);
        }
        #cursor-header .header-actions span:hover { background: rgba(255,255,255,0.08); }

        #cursor-body { display: block; }
        .cursor-lang-group { display: flex; gap: 6px; font-size: 11px; color: #7f8fa3; }
        .cursor-lang-group span { cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: 0.2s; }
        .cursor-lang-group span.active { color: #a78bfa; background: rgba(167,139,250,0.1); }

        .cursor-module { width: 100%; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .cursor-module-title { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: #9aabbf; margin-bottom: 6px; }
        .cursor-module-title button {
            background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.1);
            border-radius: 6px; padding: 2px 10px; font-size: 10px; color: #c4b5fd; cursor: pointer; transition: 0.2s;
        }
        .cursor-module-title button:hover { background: rgba(167,139,250,0.2); }
        .cursor-row { display: flex; flex-wrap: wrap; gap: 6px 12px; }
        .cursor-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #b8c4d8; cursor: pointer; }
        .cursor-item input[type="checkbox"] { accent-color: #a78bfa; width: 14px; height: 14px; cursor: pointer; }

        .cursor-footer {
            margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.03);
            text-align: center; font-size: 10px; color: #5a6a84; display: flex; flex-direction: column; gap: 6px;
        }
        .cursor-footer .footer-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .cursor-footer .footer-actions button {
            padding: 3px 12px; border-radius: 6px; font-size: 11px; cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1); transition: 0.2s;
        }
        .cursor-footer .footer-actions .btn-enable { background: rgba(52,211,153,0.15); color: #6ee7b7; }
        .cursor-footer .footer-actions .btn-disable { background: rgba(248,113,113,0.15); color: #fca5a5; }
        .cursor-footer .footer-actions .btn-reset { background: rgba(167,139,250,0.12); color: #c4b5fd; }
        .cursor-footer .footer-actions button:hover { filter: brightness(1.2); }

        /* 设置弹窗样式 */
        #cursor-settings-panel {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95);
            z-index: 99999999; width: 420px; max-width: 92%;
            background: rgba(20,20,30,0.96); backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.06); border-radius: 24px;
            padding: 24px; box-shadow: 0 32px 80px rgba(0,0,0,0.6);
            color: #eaeef5; font-family: system-ui, sans-serif; font-size: 13px;
            opacity: 0; pointer-events: none; transition: all 0.3s ease;
        }
        #cursor-settings-panel.open { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }
        #cursor-settings-panel .settings-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 12px; margin-bottom: 12px; }
        #cursor-settings-panel .settings-header h4 { margin: 0; color: #a78bfa; }
        #cursor-settings-panel .settings-header span { cursor: pointer; color: #7f8fa3; }
        #cursor-settings-panel .changelog-list { list-style: none; padding: 0; margin: 0; }
        #cursor-settings-panel .changelog-list li { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03); color: #b8c4d8; }
    `);

    // ==========================================================
    // 3. 面板创建与交互（含内置更新日志弹窗）
    // ==========================================================
    let panelInstance = null;
    let isCollapsed = false;
    let isDragging = false;

    function openSettings() {
        let settingsPanel = document.getElementById('cursor-settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('open');
            return;
        }

        settingsPanel = document.createElement('div');
        settingsPanel.id = 'cursor-settings-panel';
        settingsPanel.innerHTML = `
            <div class="settings-header">
                <h4>${LANG[currentLang].settings}</h4>
                <span id="settings-close-btn">✕</span>
            </div>
            <div style="margin-bottom:12px;">
                <div style="font-weight:600; color:#9aabbf; font-size:14px;">${LANG[currentLang].changelog}</div>
            </div>
            <ul class="changelog-list">
                ${LANG[currentLang].changelog_list.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <div style="margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.03); font-size:11px; color:#5a6a84;">
                ${LANG[currentLang].footer}
            </div>
        `;
        document.body.appendChild(settingsPanel);

        settingsPanel.querySelector('#settings-close-btn').addEventListener('click', () => {
            settingsPanel.classList.remove('open');
            setTimeout(() => settingsPanel.remove(), 300);
        });

        setTimeout(() => settingsPanel.classList.add('open'), 50);
    }

    function createPanel() {
        const oldPanel = document.getElementById('cursor-panel');
        if (oldPanel) oldPanel.remove();

        const panel = document.createElement('div');
        panel.id = 'cursor-panel';
        panel.innerHTML = `
            <div class="cursor-collapsed-icon">✦</div>
            <div id="cursor-header">
                <h3>${LANG[currentLang].panelTitle} <small>v1.0</small></h3>
                <div class="header-actions">
                    <span id="cursor-settings-btn">⚙️</span>
                    <span id="cursor-collapse-btn">⤡</span>
                    <span id="cursor-close-btn">✕</span>
                </div>
            </div>
            <div id="cursor-body">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div style="font-size:12px;color:#9aabbf;">30项功能</div>
                    <div class="cursor-lang-group">
                        <span data-lang="zh" class="${currentLang === 'zh' ? 'active' : ''}">中</span>
                        <span data-lang="en" class="${currentLang === 'en' ? 'active' : ''}">EN</span>
                        <span data-lang="ja" class="${currentLang === 'ja' ? 'active' : ''}">日</span>
                    </div>
                </div>
                <div id="cursor-modules-container"></div>
                <div class="cursor-footer">
                    <div class="footer-actions">
                        <button class="btn-enable" id="cursor-enable-all">${LANG[currentLang].enableAll}</button>
                        <button class="btn-disable" id="cursor-disable-all">${LANG[currentLang].disableAll}</button>
                        <button class="btn-reset" id="cursor-reset-all">${LANG[currentLang].reset}</button>
                    </div>
                    <div>${LANG[currentLang].footer}</div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        panelInstance = panel;

        renderModules();

        // --- 设置按钮 ---
        panel.querySelector('#cursor-settings-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openSettings();
        });

        // --- 语言切换 ---
        panel.querySelectorAll('.cursor-lang-group span').forEach(el => {
            el.addEventListener('click', function() {
                currentLang = this.dataset.lang;
                localStorage.setItem('cursor_lang', currentLang);
                // 刷新面板标题和文字
                panel.querySelector('h3').innerHTML = `${LANG[currentLang].panelTitle} <small>v1.0</small>`;
                panel.querySelector('.cursor-footer div:last-child').textContent = LANG[currentLang].footer;
                panel.querySelectorAll('.cursor-module-title button').forEach(btn => {
                    btn.textContent = LANG[currentLang].groupOn;
                });
                panel.querySelector('#cursor-enable-all').textContent = LANG[currentLang].enableAll;
                panel.querySelector('#cursor-disable-all').textContent = LANG[currentLang].disableAll;
                panel.querySelector('#cursor-reset-all').textContent = LANG[currentLang].reset;
                // 切换高亮样式
                panel.querySelectorAll('.cursor-lang-group span').forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                // 刷新功能标签
                renderModules(true);
            });
        });

        // --- 折叠 ---
        document.getElementById('cursor-collapse-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            isCollapsed = !isCollapsed;
            panel.classList.toggle('collapsed', isCollapsed);

            // 当面板变成折叠状态时，动态修改折叠圆球的样式和拖拽逻辑
            if (isCollapsed) {
                const ball = panel;
                // 1. 改变位置到右下角
                ball.style.top = 'auto';
                ball.style.right = '30px';
                ball.style.bottom = '30px';
                // 2. 加上半透明
                ball.style.opacity = '0.6';
                ball.style.transition = 'opacity 0.3s';

                // 3. 为折叠状态下的圆球绑定拖拽事件
                let isBallDragging = false;
                let ballOffsetX, ballOffsetY;

                const onBallMouseDown = (ev) => {
                    isBallDragging = true;
                    const rect = ball.getBoundingClientRect();
                    ballOffsetX = ev.clientX - rect.left;
                    ballOffsetY = ev.clientY - rect.top;
                    ball.style.cursor = 'grabbing';
                };

                const onBallMouseMove = (ev) => {
                    if (!isBallDragging) return;
                    ball.style.left = (ev.clientX - ballOffsetX) + 'px';
                    ball.style.top = (ev.clientY - ballOffsetY) + 'px';
                    ball.style.right = 'auto';
                    ball.style.bottom = 'auto';
                };

                const onBallMouseUp = () => {
                    if (isBallDragging) {
                        isBallDragging = false;
                        ball.style.cursor = '';
                        document.removeEventListener('mousemove', onBallMouseMove);
                        document.removeEventListener('mouseup', onBallMouseUp);
                    }
                };

                ball.addEventListener('mousedown', onBallMouseDown);
                document.addEventListener('mousemove', onBallMouseMove);
                document.addEventListener('mouseup', onBallMouseUp);
            }
        });

        // 点击折叠状态的小圆点展开面板
        panel.addEventListener('click', (e) => {
            if (isCollapsed && (e.target === panel || e.target.closest('.cursor-collapsed-icon'))) {
                isCollapsed = false;
                panel.classList.remove('collapsed');
                // 展开后恢复原本的透明度
                panel.style.opacity = '1';
            }
        });

        // --- 关闭 (彻底移除面板，并弹出提示条) ---
        document.getElementById('cursor-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            panel.remove();
            panelInstance = null;

            // 补回原版那个“刷新页面可重新打开”的提示条
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                background: rgba(20,20,30,0.9); backdrop-filter: blur(10px);
                color: #b8c4d8; padding: 8px 20px; border-radius: 12px;
                font-size: 13px; font-family: system-ui, sans-serif;
                border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                z-index: 99999999; opacity: 0; transition: opacity 0.3s ease;
            `;
            toast.textContent = '📦 面板已关闭，刷新页面可重新打开';
            document.body.appendChild(toast);

            // 0.3秒后淡入
            setTimeout(() => { toast.style.opacity = '1'; }, 50);
            // 3秒后自动消失
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        });

        // --- 拖拽 ---
        const header = document.getElementById('cursor-header');
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.header-actions')) return;
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            panel.style.cursor = 'grabbing';

            function onMove(ev) {
                if (!isDragging) return;
                panel.style.left = (ev.clientX - offsetX) + 'px';
                panel.style.top = (ev.clientY - offsetY) + 'px';
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
            }
            function onUp() {
                isDragging = false;
                panel.style.cursor = '';
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            e.preventDefault();
        });

        // --- 全局功能按钮 ---
        document.getElementById('cursor-enable-all').addEventListener('click', () => {
            for (const key in cfg) {
                if (!cfg[key]) { cfg[key] = true; saveCfg(key); if (typeof featureMap[key]?.enable === 'function') featureMap[key].enable(); }
            }
            renderModules(true);
        });
        document.getElementById('cursor-disable-all').addEventListener('click', () => {
            for (const key in cfg) {
                if (cfg[key]) { cfg[key] = false; saveCfg(key); if (typeof featureMap[key]?.disable === 'function') featureMap[key].disable(); }
            }
            renderModules(true);
        });
        document.getElementById('cursor-reset-all').addEventListener('click', () => {
            if (confirm('确定要重置所有功能吗？')) {
                for (const k in cfg) {
                    if (cfg[k] && typeof featureMap[k]?.disable === 'function') featureMap[k].disable();
                    cfg[k] = false;
                    localStorage.removeItem('cursor_30_' + k);
                }
                renderModules(true);
            }
        });
    }

    function renderModules(skipStateUpdate = false) {
        const container = document.getElementById('cursor-modules-container');
        if (!container) return;

        const mods = LANG[currentLang].modules;
        const groupMap = [
            { name: '📖 阅读体感', keys: ['reading','progress','smooth','highlight','preview','noDrag','codeFont'] },
            { name: '⌨️ 输入辅助', keys: ['email','symbol','clearInput','glow','tabIndent','cleanCopy','selectAll'] },
            { name: '🎬 视频控制', keys: ['speed','mute','loop','hideCtrl'] },
            { name: '🧰 页面工具', keys: ['goTop','goBottom','note','closePopup','clickHide','grayMode','hideScrollbar','pageReady'] }
        ];

        let html = '';
        groupMap.forEach(group => {
            const labels = mods[group.name] || [];
            html += `
                <div class="cursor-module">
                    <div class="cursor-module-title">
                        <span>${group.name}</span>
                        <button class="cursor-group-on">${LANG[currentLang].groupOn}</button>
                    </div>
                    <div class="cursor-row">
            `;
            group.keys.forEach((key, idx) => {
                const label = labels[idx] || key;
                html += `
                    <label class="cursor-item">
                        <input type="checkbox" data-key="${key}" ${cfg[key] ? 'checked' : ''}> ${label}
                    </label>
                `;
            });
            html += `</div></div>`;
        });
        container.innerHTML = html;

        if (!skipStateUpdate) {
            // 重新绑定开关事件
            container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.addEventListener('change', function() {
                    const key = this.dataset.key;
                    const isChecked = this.checked;
                    cfg[key] = isChecked;
                    saveCfg(key);
                    if (isChecked && featureMap[key]?._state === true) return;
                    if (!isChecked && featureMap[key]?._state === false) return;
                    if (isChecked && typeof featureMap[key]?.enable === 'function') featureMap[key].enable();
                    else if (!isChecked && typeof featureMap[key]?.disable === 'function') featureMap[key].disable();
                });
            });

            // 模块全开
            container.querySelectorAll('.cursor-group-on').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const module = this.closest('.cursor-module');
                    const keys = Array.from(module.querySelectorAll('input[type="checkbox"]')).map(cb => cb.dataset.key);
                    keys.forEach(key => {
                        if (!cfg[key]) { cfg[key] = true; saveCfg(key); if (typeof featureMap[key]?.enable === 'function') featureMap[key].enable(); }
                    });
                    renderModules(true);
                });
            });
        }
    }

    // ==========================================================
    // 4. 启动时恢复配置
    // ==========================================================
    for (const k in cfg) {
        if (cfg[k] && typeof featureMap[k]?.enable === 'function') {
            featureMap[k].enable();
        }
    }

    createPanel();

    // ==========================================================
    // 5. 30项功能完整实现
    // ==========================================================
    const featureMap = {
        // --- 阅读体验 ---
        reading: { _state: false, enable: () => {
            if (featureMap.reading._state) return;
            const s = document.createElement('style');
            s.id = 'cursor-reading';
            s.textContent = `nav, header, footer, aside, .sidebar, .comments, .ad-box { display: none !important; } body, html { background: #ffffff !important; color: #222 !important; } body { max-width: 720px !important; margin: 40px auto !important; padding: 20px !important; font-size: 18px !important; line-height: 1.9 !important; }`;
            document.head.appendChild(s);
            featureMap.reading._state = true;
        }, disable: () => { document.getElementById('cursor-reading')?.remove(); featureMap.reading._state = false; } },
        progress: { _state: false, enable: () => {
            if (featureMap.progress._state) return;
            const bar = document.createElement('div');
            bar.id = 'cursor-bar';
            bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:#a78bfa;z-index:999999;width:0%;transition:width 0.1s;';
            document.body.appendChild(bar);
            const handler = function() {
                const h = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.width = h > 0 ? Math.min((window.scrollY / h) * 100, 100) + '%' : '0%';
            };
            window.addEventListener('scroll', handler);
            featureMap.progress._handler = handler;
            featureMap.progress._state = true;
        }, disable: () => {
            document.getElementById('cursor-bar')?.remove();
            if (featureMap.progress._handler) { window.removeEventListener('scroll', featureMap.progress._handler); delete featureMap.progress._handler; }
            featureMap.progress._state = false;
        } },
        smooth: { _state: false, enable: () => {
            if (featureMap.smooth._state) return;
            const handler = function(e) {
                if (['ArrowUp','ArrowDown','PageUp','PageDown','Space'].includes(e.key) || e.key === ' ') {
                    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                        e.preventDefault();
                        const step = e.key.includes('Up') || e.key === 'PageUp' ? -300 : 300;
                        window.scrollBy({ top: step, behavior: 'smooth' });
                    }
                }
            };
            document.addEventListener('keydown', handler);
            featureMap.smooth._handler = handler;
            featureMap.smooth._state = true;
        }, disable: () => {
            if (featureMap.smooth._handler) { document.removeEventListener('keydown', featureMap.smooth._handler); delete featureMap.smooth._handler; }
            featureMap.smooth._state = false;
        } },
        highlight: { _state: false, enable: () => {
            if (featureMap.highlight._state) return;
            const handler = function(e) {
                const p = e.target.closest('p');
                if (!p) return;
                if (p.dataset.hl === 'true') { p.style.background = ''; p.dataset.hl = 'false'; } else { p.style.background = '#fef3c7'; p.dataset.hl = 'true'; }
            };
            document.addEventListener('dblclick', handler);
            featureMap.highlight._handler = handler;
            featureMap.highlight._state = true;
        }, disable: () => {
            if (featureMap.highlight._handler) { document.removeEventListener('dblclick', featureMap.highlight._handler); delete featureMap.highlight._handler; }
            featureMap.highlight._state = false;
        } },
        preview: { _state: false, enable: () => {
            if (featureMap.preview._state) return;
            const handler = function(e) {
                const img = e.target.closest('img');
                if (!img || !img.src) return;
                const v = document.createElement('div');
                v.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
                const imgEl = document.createElement('img');
                imgEl.src = img.src;
                imgEl.style.cssText = 'max-width:90%;max-height:90%;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.5);';
                v.appendChild(imgEl);
                v.onclick = () => v.remove();
                document.body.appendChild(v);
            };
            document.addEventListener('click', handler);
            featureMap.preview._handler = handler;
            featureMap.preview._state = true;
        }, disable: () => {
            if (featureMap.preview._handler) { document.removeEventListener('click', featureMap.preview._handler); delete featureMap.preview._handler; }
            featureMap.preview._state = false;
        } },
        noDrag: { _state: false, enable: () => {
            if (featureMap.noDrag._state) return;
            const handler = function(e) {
                if (e.target.closest('img')) e.preventDefault();
            };
            document.addEventListener('dragstart', handler);
            featureMap.noDrag._handler = handler;
            featureMap.noDrag._state = true;
        }, disable: () => {
            if (featureMap.noDrag._handler) { document.removeEventListener('dragstart', featureMap.noDrag._handler); delete featureMap.noDrag._handler; }
            featureMap.noDrag._state = false;
        } },
        codeFont: { _state: false, enable: () => {
            if (featureMap.codeFont._state) return;
            const s = document.createElement('style');
            s.id = 'cursor-codefont';
            s.textContent = `pre, code { font-family: 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace !important; font-size: 14px !important; }`;
            document.head.appendChild(s);
            featureMap.codeFont._state = true;
        }, disable: () => { document.getElementById('cursor-codefont')?.remove(); featureMap.codeFont._state = false; } },

        // --- 输入辅助 ---
        email: { _state: false, enable: () => {
            if (featureMap.email._state) return;
            const EMAIL_MAP = { 'qq':'qq@qq.com','gm':'gm@gmail.com','163':'163@163.com','126':'126@126.com','out':'out@outlook.com','hot':'hot@hotmail.com','sina':'sina@sina.com','ali':'ali@aliyun.com','fox':'fox@foxmail.com' };
            let lastCompleted = '';
            const handler = function(e) {
                const t = e.target;
                if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA')) return;
                const val = t.value, pos = t.selectionStart;
                if (val === lastCompleted && pos === val.length) return;
                for (let len = 6; len >= 2; len--) {
                    if (pos >= len) {
                        const sub = val.substring(pos - len, pos).toLowerCase();
                        if (EMAIL_MAP[sub]) {
                            const before = val.substring(0, pos - len);
                            const after = val.substring(pos);
                            const newVal = before + EMAIL_MAP[sub] + after;
                            if (newVal !== val) { t.value = newVal; lastCompleted = newVal; t.selectionStart = t.selectionEnd = before.length + EMAIL_MAP[sub].length; t.dispatchEvent(new Event('input', { bubbles: true })); }
                            return;
                        }
                    }
                }
                lastCompleted = '';
            };
            document.addEventListener('input', handler);
            featureMap.email._handler = handler;
            featureMap.email._state = true;
        }, disable: () => {
            if (featureMap.email._handler) { document.removeEventListener('input', featureMap.email._handler); delete featureMap.email._handler; }
            featureMap.email._state = false;
        } },
        symbol: { _state: false, enable: () => {
            if (featureMap.symbol._state) return;
            const handler = function(e) {
                const t = e.target;
                if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
                const v = t.value, pos = t.selectionStart;
                if (pos >= 2) {
                    const sub = v.substring(pos - 2, pos);
                    if (sub === '..') { t.value = v.substring(0, pos - 2) + '。' + v.substring(pos); t.selectionStart = t.selectionEnd = pos - 1; }
                    else if (sub === ',,') { t.value = v.substring(0, pos - 2) + '，' + v.substring(pos); t.selectionStart = t.selectionEnd = pos - 1; }
                }
            };
            document.addEventListener('input', handler);
            featureMap.symbol._handler = handler;
            featureMap.symbol._state = true;
        }, disable: () => {
            if (featureMap.symbol._handler) { document.removeEventListener('input', featureMap.symbol._handler); delete featureMap.symbol._handler; }
            featureMap.symbol._state = false;
        } },
        clearInput: { _state: false, enable: () => {
            if (featureMap.clearInput._state) return;
            const handler = function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'Backspace') {
                    const t = e.target;
                    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') { e.preventDefault(); t.value = ''; t.dispatchEvent(new Event('input', { bubbles: true })); }
                }
            };
            document.addEventListener('keydown', handler);
            featureMap.clearInput._handler = handler;
            featureMap.clearInput._state = true;
        }, disable: () => {
            if (featureMap.clearInput._handler) { document.removeEventListener('keydown', featureMap.clearInput._handler); delete featureMap.clearInput._handler; }
            featureMap.clearInput._state = false;
        } },
        glow: { _state: false, enable: () => {
            if (featureMap.glow._state) return;
            const s = document.createElement('style');
            s.id = 'cursor-glow';
            s.textContent = `input:focus, textarea:focus { outline: 2px solid #a78bfa !important; outline-offset: 2px !important; }`;
            document.head.appendChild(s);
            featureMap.glow._state = true;
        }, disable: () => { document.getElementById('cursor-glow')?.remove(); featureMap.glow._state = false; } },
        tabIndent: { _state: false, enable: () => {
            if (featureMap.tabIndent._state) return;
            const handler = function(e) {
                if (e.key !== 'Tab') return;
                const t = e.target;
                if (t.tagName !== 'TEXTAREA') return;
                e.preventDefault();
                const start = t.selectionStart, end = t.selectionEnd;
                t.value = t.value.substring(0, start) + '    ' + t.value.substring(end);
                t.selectionStart = t.selectionEnd = start + 4;
            };
            document.addEventListener('keydown', handler);
            featureMap.tabIndent._handler = handler;
            featureMap.tabIndent._state = true;
        }, disable: () => {
            if (featureMap.tabIndent._handler) { document.removeEventListener('keydown', featureMap.tabIndent._handler); delete featureMap.tabIndent._handler; }
            featureMap.tabIndent._state = false;
        } },
        cleanCopy: { _state: false, enable: () => {
            if (featureMap.cleanCopy._state) return;
            const handler = function(e) {
                function clean(text) {
                    if (!text) return '';
                    let t = text.replace(/\n{3,}/g, '\n\n');
                    t = t.replace(/本文由\s*[\u4e00-\u9fa5a-zA-Z]+\s*提供.*$/gm, '');
                    t = t.trim();
                    return t;
                }
                const s = window.getSelection();
                if (!s || !s.toString().trim()) return;
                const cleaned = clean(s.toString());
                if (cleaned !== s.toString()) { e.preventDefault(); e.clipboardData.setData('text/plain', cleaned); }
            };
            document.addEventListener('copy', handler);
            featureMap.cleanCopy._handler = handler;
            featureMap.cleanCopy._state = true;
        }, disable: () => {
            if (featureMap.cleanCopy._handler) { document.removeEventListener('copy', featureMap.cleanCopy._handler); delete featureMap.cleanCopy._handler; }
            featureMap.cleanCopy._state = false;
        } },
        selectAll: { _state: false, enable: () => {
            if (featureMap.selectAll._state) return;
            const handler = function(e) {
                if (e.ctrlKey && e.key === 'a') {
                    const t = e.target;
                    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') { e.preventDefault(); t.select(); }
                }
            };
            document.addEventListener('keydown', handler);
            featureMap.selectAll._handler = handler;
            featureMap.selectAll._state = true;
        }, disable: () => {
            if (featureMap.selectAll._handler) { document.removeEventListener('keydown', featureMap.selectAll._handler); delete featureMap.selectAll._handler; }
            featureMap.selectAll._state = false;
        } },

        // --- 视频控制 ---
        speed: { _state: false, enable: () => {
            if (featureMap.speed._state) return;
            const handler = function(e) {
                if (e.ctrlKey && e.key === ']') { document.querySelectorAll('video').forEach(v => { v.playbackRate = Math.min(v.playbackRate + 0.25, 4); }); }
                else if (e.ctrlKey && e.key === '[') { document.querySelectorAll('video').forEach(v => { v.playbackRate = Math.max(v.playbackRate - 0.25, 0.25); }); }
                else if (e.ctrlKey && e.key === '\\') { document.querySelectorAll('video').forEach(v => { v.playbackRate = 1; }); }
            };
            document.addEventListener('keydown', handler);
            featureMap.speed._handler = handler;
            featureMap.speed._state = true;
        }, disable: () => {
            if (featureMap.speed._handler) { document.removeEventListener('keydown', featureMap.speed._handler); delete featureMap.speed._handler; }
            featureMap.speed._state = false;
        } },
        mute: { _state: false, enable: () => {
            if (featureMap.mute._state) return;
            const handler = function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'M') { e.preventDefault(); document.querySelectorAll('video').forEach(v => { v.muted = !v.muted; }); }
            };
            document.addEventListener('keydown', handler);
            featureMap.mute._handler = handler;
            featureMap.mute._state = true;
        }, disable: () => {
            if (featureMap.mute._handler) { document.removeEventListener('keydown', featureMap.mute._handler); delete featureMap.mute._handler; }
            featureMap.mute._state = false;
        } },
        loop: { _state: false, enable: () => {
            if (featureMap.loop._state) return;
            const handler = function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'L') { e.preventDefault(); document.querySelectorAll('video').forEach(v => { v.loop = !v.loop; }); }
            };
            document.addEventListener('keydown', handler);
            featureMap.loop._handler = handler;
            featureMap.loop._state = true;
        }, disable: () => {
            if (featureMap.loop._handler) { document.removeEventListener('keydown', featureMap.loop._handler); delete featureMap.loop._handler; }
            featureMap.loop._state = false;
        } },
        hideCtrl: { _state: false, enable: () => {
            if (featureMap.hideCtrl._state) return;
            const s = document.createElement('style');
            s.id = 'cursor-hidecontrols';
            s.textContent = `video::-webkit-media-controls { opacity: 0 !important; pointer-events: none !important; } video:hover::-webkit-media-controls { opacity: 1 !important; pointer-events: auto !important; }`;
            document.head.appendChild(s);
            featureMap.hideCtrl._state = true;
        }, disable: () => { document.getElementById('cursor-hidecontrols')?.remove(); featureMap.hideCtrl._state = false; } },

        // --- 页面工具 ---
        goTop: { _state: false, enable: () => {
            if (featureMap.goTop._state) return;
            const btn = document.createElement('div');
            btn.id = 'cursor-gotop';
            btn.textContent = '⬆';
            btn.style.cssText = 'position:fixed;bottom:80px;right:30px;z-index:99999;background:#2a2a4e;color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.3s;';
            document.body.appendChild(btn);
            const handler = function() {
                btn.style.opacity = window.scrollY > 400 ? '1' : '0';
            };
            window.addEventListener('scroll', handler);
            btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
            featureMap.goTop._handler = handler;
            featureMap.goTop._state = true;
        }, disable: () => {
            document.getElementById('cursor-gotop')?.remove();
            if (featureMap.goTop._handler) { window.removeEventListener('scroll', featureMap.goTop._handler); delete featureMap.goTop._handler; }
            featureMap.goTop._state = false;
        } },
        goBottom: { _state: false, enable: () => {
            if (featureMap.goBottom._state) return;
            const handler = function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'ArrowDown') {
                    e.preventDefault();
                    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                }
            };
            document.addEventListener('keydown', handler);
            featureMap.goBottom._handler = handler;
            featureMap.goBottom._state = true;
        }, disable: () => {
            if (featureMap.goBottom._handler) { document.removeEventListener('keydown', featureMap.goBottom._handler); delete featureMap.goBottom._handler; }
            featureMap.goBottom._state = false;
        } },
        note: { _state: false, enable: () => {
            if (featureMap.note._state) return;
            const note = document.createElement('div');
            note.id = 'cursor-notepad';
            note.style.cssText = 'position:fixed;bottom:140px;right:30px;z-index:99999;width:240px;height:180px;background:rgba(30,30,45,0.9);backdrop-filter:blur(8px);border-radius:12px;border:1px solid rgba(255,255,255,0.05);padding:12px;color:#eef2fb;display:none;';
            note.innerHTML = `<textarea id="cursor-note-text" style="width:100%;height:100%;background:transparent;border:none;color:#eef2fb;resize:none;outline:none;font-size:13px;font-family:inherit;" placeholder="📝 临时记录... (刷新页面消失)"></textarea>`;
            document.body.appendChild(note);
            const handler = function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                    e.preventDefault();
                    note.style.display = note.style.display === 'none' ? 'block' : 'none';
                }
            };
            document.addEventListener('keydown', handler);
            featureMap.note._handler = handler;
            featureMap.note._state = true;
        }, disable: () => {
            document.getElementById('cursor-notepad')?.remove();
            if (featureMap.note._handler) { document.removeEventListener('keydown', featureMap.note._handler); delete featureMap.note._handler; }
            featureMap.note._state = false;
        } },
        closePopup: { _state: false, enable: () => {
            if (featureMap.closePopup._state) return;
            const handler = function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'X') {
                    const popups = document.querySelectorAll('.modal, .popup, [role="dialog"], [class*="overlay"]');
                    popups.forEach(el => {
                        if (el.offsetParent !== null) {
                            const closeBtn = el.querySelector('button, .close, [aria-label="关闭"]');
                            if (closeBtn) closeBtn.click();
                            else el.style.display = 'none';
                        }
                    });
                }
            };
            document.addEventListener('keydown', handler);
            featureMap.closePopup._handler = handler;
            featureMap.closePopup._state = true;
        }, disable: () => {
            if (featureMap.closePopup._handler) { document.removeEventListener('keydown', featureMap.closePopup._handler); delete featureMap.closePopup._handler; }
            featureMap.closePopup._state = false;
        } },
        clickHide: { _state: false, enable: () => {
            if (featureMap.clickHide._state) return;
            let isHideMode = false;
            const hideBtn = document.createElement('div');
            hideBtn.id = 'cursor-hide-btn';
            hideBtn.textContent = '🕶️ 隐藏模式';
            hideBtn.style.cssText = 'position:fixed;top:80px;right:20px;z-index:999999;background:rgba(30,30,45,0.9);color:#eef2fb;padding:6px 14px;border-radius:20px;font-size:12px;cursor:pointer;display:none;border:1px solid rgba(255,255,255,0.05);';
            document.body.appendChild(hideBtn);

            function resetHideMode() {
                if (isHideMode) {
                    isHideMode = false;
                    hideBtn.style.display = 'none';
                    document.body.style.cursor = 'default';
                    document.removeEventListener('click', hideHandler, true);
                }
            }

            function hideHandler(ev) {
                if (!isHideMode) return;
                if (ev.target.tagName === 'BODY' || ev.target.id === 'cursor-hide-btn') return;
                ev.preventDefault(); ev.stopPropagation();
                ev.target.style.display = 'none';
            }

            const handler = function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                    e.preventDefault();
                    if (!isHideMode) {
                        isHideMode = true;
                        hideBtn.style.display = 'block';
                        document.body.style.cursor = 'crosshair';
                        document.addEventListener('click', hideHandler, true);
                    } else {
                        resetHideMode();
                    }
                }
            };
            document.addEventListener('keydown', handler);
            hideBtn.onclick = () => resetHideMode();
            featureMap.clickHide._handler = handler;
            featureMap.clickHide._btn = hideBtn;
            featureMap.clickHide._reset = resetHideMode;
            featureMap.clickHide._state = true;
        }, disable: () => {
            if (featureMap.clickHide._reset) featureMap.clickHide._reset();
            if (featureMap.clickHide._btn) featureMap.clickHide._btn.remove();
            if (featureMap.clickHide._handler) { document.removeEventListener('keydown', featureMap.clickHide._handler); delete featureMap.clickHide._handler; }
            delete featureMap.clickHide._reset;
            delete featureMap.clickHide._btn;
            featureMap.clickHide._state = false;
        } },
        grayMode: { _state: false, enable: () => {
            if (featureMap.grayMode._state) return;
            const s = document.createElement('style');
            s.id = 'cursor-gray';
            s.textContent = `html { filter: grayscale(100%) !important; } img, video { filter: grayscale(100%) !important; }`;
            document.head.appendChild(s);
            featureMap.grayMode._state = true;
        }, disable: () => { document.getElementById('cursor-gray')?.remove(); featureMap.grayMode._state = false; } },
        hideScrollbar: { _state: false, enable: () => {
            if (featureMap.hideScrollbar._state) return;
            const s = document.createElement('style');
            s.id = 'cursor-hidescroll';
            s.textContent = `::-webkit-scrollbar { width: 0px !important; height: 0px !important; }`;
            document.head.appendChild(s);
            featureMap.hideScrollbar._state = true;
        }, disable: () => { document.getElementById('cursor-hidescroll')?.remove(); featureMap.hideScrollbar._state = false; } },
        pageReady: { _state: false, enable: () => {
            if (featureMap.pageReady._state) return;
            const toast = document.createElement('div');
            toast.id = 'cursor-ready';
            toast.textContent = '✓ 页面已加载完成';
            toast.style.cssText = `
                position: fixed; bottom: 90px; right: 30px; z-index: 999999;
                background: rgba(30,30,45,0.85); backdrop-filter: blur(8px);
                padding: 8px 16px; border-radius: 12px; color: #a78bfa;
                font-size: 13px; font-family: system-ui; pointer-events: none;
                opacity: 1; transition: opacity 0.3s;
            `;
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 1500);
            featureMap.pageReady._state = true;
        }, disable: () => { document.getElementById('cursor-ready')?.remove(); featureMap.pageReady._state = false; } }
    };

    console.log('✦ 游标 v1.0 已加载 ');

    // ==========================================================
    // 6. 自动更新检测 (修复为带横杠的仓库)
    // ==========================================================
    (function() {
        const CURRENT_VERSION = 'v1.0';
        const REPO_OWNER = 'Guan-Blip';
        const REPO_NAME = 'cursor-enhance-';
        const IGNORED_VER_KEY = 'cursor_ignored_update';

        setTimeout(() => {
            const ignoredVersion = localStorage.getItem(IGNORED_VER_KEY);
            fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`)
                .then(response => response.json())
                .then(data => {
                    const remoteVersion = data.tag_name;
                    if (remoteVersion === CURRENT_VERSION || remoteVersion === ignoredVersion) return;

                    const updateDiv = document.createElement('div');
                    updateDiv.style.cssText = `
                        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                        background: rgba(20, 24, 36, 0.95); backdrop-filter: blur(12px);
                        border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
                        padding: 12px 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                        color: #eef2fb; font-family: system-ui, sans-serif; font-size: 13px;
                        z-index: 99999999; display: flex; align-items: center; gap: 16px;
                    `;
                    updateDiv.innerHTML = `
                        <span>🚀 发现新版本 <b style="color:#a78bfa;">${remoteVersion}</b>（当前 ${CURRENT_VERSION}）</span>
                        <a href="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest" target="_blank" style="
                            padding: 6px 16px; border-radius: 8px; background: #a78bfa; color: #fff;
                            text-decoration: none; font-weight: 600; cursor: pointer; font-size: 12px;
                        ">立即更新</a>
                        <span id="close-update-tip" style="cursor:pointer; opacity:0.5; font-size: 16px;">✕</span>
                    `;
                    document.body.appendChild(updateDiv);

                    document.getElementById('close-update-tip').onclick = () => {
                        localStorage.setItem(IGNORED_VER_KEY, remoteVersion);
                        updateDiv.remove();
                    };
                })
                .catch(() => {});
        }, 5000);
    })();

})();