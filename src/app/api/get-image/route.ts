import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url'); 

    if (!url) {
        return NextResponse.json({ error: '缺少 URL 參數' }, { status: 400 });
    }

    try {
        // 發送請求到 Google Maps API，取得圖片
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow', 
        });

        const finalUrl = response.url;

        return NextResponse.json({ finalUrl });
    } catch (error) {
        console.error('獲取圖片網址失敗:', error);
        return NextResponse.json({ error: '無法取得圖片網址' }, { status: 500 });
    }
}
