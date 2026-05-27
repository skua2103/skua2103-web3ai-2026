import { GoogleGenerativeAI } from '@google/generative-ai';

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  status: 'todo' | 'doing' | 'done';
  notes: string;
}

export interface Roadmap {
  title: string;
  description: string;
  steps: RoadmapStep[];
}

// プリセットの高品質モックデータ
const PRESET_ROADMAPS: Record<string, { title: string; description: string; steps: Omit<RoadmapStep, 'id' | 'status' | 'notes'>[] }> = {
  react: {
    title: "React & TypeScript マスターへの道",
    description: "モダンなWebフロントエンド開発の標準であるReactとTypeScriptを、基礎から実践的なコンポーネント設計まで体系的に習得するロードマップです。",
    steps: [
      { title: "HTML/CSS & JavaScript (ES6+) のおさらい", description: "アロー関数、分割代入、スプレッド構文、Promiseなど、Reactで頻出するモダンなJS仕様を学びます。", estimatedTime: "3日間" },
      { title: "Reactの基本コンセプトとJSX", description: "コンポーネント、Props、状態管理（useState）、イベントハンドリングを理解し、シンプルなカウンターアプリを作ります。", estimatedTime: "5日間" },
      { title: "Hooksの深掘りと副作用の管理", description: "useEffectを使ったAPI連携やデータのクリーンアップ、カスタムフックの作成方法を習得します。", estimatedTime: "1週間" },
      { title: "TypeScriptとの統合", description: "Reactコンポーネントの型定義、Propsやイベントの型付け、ジェネリクスを使った再利用性の高いコンポーネント設計を学びます。", estimatedTime: "1週間" },
      { title: "ルーティングと状態管理ライブラリ", description: "React Routerを使った画面遷移と、Context APIやZustandによるグローバルな状態管理パターンを実装します。", estimatedTime: "1週間" },
      { title: "実践的なWebアプリの構築", description: "Viteを使用したプロジェクトの初期化から、API連携、アニメーション、レスポンシブデザインを施したポートフォリオを構築します。", estimatedTime: "2週間" }
    ]
  },
  web3: {
    title: "Web3 & ブロックチェーン開発入門",
    description: "暗号資産、スマートコントラクトの基礎から、分散型アプリケーション（dApp）のフロントエンド実装までを学ぶロードマップです。",
    steps: [
      { title: "ブロックチェーンとWeb3の概念理解", description: "分散型台帳、PoW/PoS、ウォレット（MetaMask）、ガス代など、Web3世界の基本思想と仕組みを学びます。", estimatedTime: "3日間" },
      { title: "Solidityによるスマートコントラクト開発の基本", description: "Solidity言語の文法、変数型、関数、修飾子を学び、簡単なERC-20（独自トークン）コントラクトを記述します。", estimatedTime: "1週間" },
      { title: "開発ツール（Hardhat / Foundry）の使い方", description: "ローカルテスト環境の立ち上げ、スマートコントラクトのデプロイスクリプト、ユニットテストの書き方をマスターします。", estimatedTime: "1週間" },
      { title: "dAppフロントエンド連携 (ethers.js / viem)", description: "Reactアプリにウォレット接続ボタンを実装し、コントラクトの読み取り・書き込み関数を呼び出す仕組みを作ります。", estimatedTime: "1週間" },
      { title: "テストネットへのデプロイと検証", description: "Sepoliaテストネットにコントラクトをデプロイし、Etherscanでのコントラクトコード検証を完了させます。", estimatedTime: "3日間" }
    ]
  },
  english: {
    title: "エンジニア向け実戦英会話ロードマップ",
    description: "ドキュメントの読解から、GitHubのPRレビュー、技術ミーティングでの発言など、エンジニア実務に必要な英語力を段階的に身につけます。",
    steps: [
      { title: "技術ドキュメントのインプット・多読", description: "MDN、公式ドキュメント、StackOverflowなどを翻訳ツールに頼りすぎず読むトレーニングを行います。", estimatedTime: "毎日30分継続" },
      { title: "英語でのテキストコミュニケーション", description: "GitHubのコミットメッセージ、PRの記述、DiscordやSlackでの簡潔で丁寧な英語テキスト表現を学びます。", estimatedTime: "1週間" },
      { title: "基本リスニングとシャドーイング", description: "技術系ポッドキャストやYouTube（DevOps、カンファレンス動画など）を聞き、シャドーイングで耳と発音を鍛えます。", estimatedTime: "2週間" },
      { title: "自己紹介とプロジェクト説明の準備", description: "自分のスキルセットや現在のプロジェクトについて、3分間で簡潔に説明できるスクリプトを作成し練習します。", estimatedTime: "5日間" },
      { title: "オンライン英会話でのデモミーティング", description: "実践としてフィードバックを得ながら、想定される設計議論や進捗報告のロールプレイを行います。", estimatedTime: "1ヶ月" }
    ]
  }
};

// 曖昧なキーワードからプリセットを判定
function findPreset(query: string): string | null {
  const q = query.toLowerCase();
  if (q.includes('react') || q.includes('フロントエンド') || q.includes('javascript') || q.includes('typescript')) {
    return 'react';
  }
  if (q.includes('web3') || q.includes('ブロックチェーン') || q.includes('solidity') || q.includes('dapp') || q.includes('smart contract')) {
    return 'web3';
  }
  if (q.includes('英語') || q.includes('英会話') || q.includes('english') || q.includes('会話')) {
    return 'english';
  }
  return null;
}

// キーワードに基づき動的にそれっぽいロードマップを自動生成するフォールバックジェネレーター
function generateDynamicMock(goal: string): Roadmap {
  const steps: Omit<RoadmapStep, 'id' | 'status' | 'notes'>[] = [
    {
      title: `1. 「${goal}」の現状分析と基礎概念の理解`,
      description: `現状の自分のスキルと目標（${goal}）のギャップを明確にし、学習に必要な前提知識や主要な用語・概念をリサーチしてマップ化します。`,
      estimatedTime: "3日間"
    },
    {
      title: "2. 必要なツール・環境のセットアップ",
      description: "学習や実践をスムーズに進めるための開発環境、ツール、参考書、オンライン教材などのインフラを整え、最初の一歩を踏み出せるようにします。",
      estimatedTime: "2日間"
    },
    {
      title: "3. コアスキルの反復演習と小さなアウトプット",
      description: "インプットするだけでなく、チュートリアルに沿って実際に手を動かし、小さなプロトタイプや演習問題を解くことで基本パターンを脳に定着させます。",
      estimatedTime: "1〜2週間"
    },
    {
      title: "4. オリジナルプロジェクト・実践への適用",
      description: "学んだ内容を活かし、自分独自の成果物（簡易アプリ、記事執筆、実際のシチュエーションでの実践など）を作成・実行し、応用力を鍛えます。",
      estimatedTime: "2週間"
    },
    {
      title: "5. レビュー、フィードバック取得と次のステップ選定",
      description: "作成した成果物を公開または自己評価し、課題を見つけます。不足しているスキルを補強し、より高度なレベルに進むための計画を再設計します。",
      estimatedTime: "5日間"
    }
  ];

  return {
    title: `${goal} 達成ロードマップ`,
    description: `「${goal}」を効率的に習得・達成するための、段階的かつ実践的なステップガイドです。`,
    steps: steps.map((s, index) => ({
      ...s,
      id: `step-${index + 1}`,
      status: 'todo',
      notes: ''
    }))
  };
}

// Gemini APIを使ったロードマップ生成
export async function generateRoadmapFromAI(goal: string, apiKey: string | null): Promise<Roadmap> {
  // APIキーがない場合、または空の場合は即座にモックに移行
  if (!apiKey || apiKey.trim() === '') {
    await new Promise(resolve => setTimeout(resolve, 1500)); // AIらしさを出すためのディレイ
    const presetKey = findPreset(goal);
    if (presetKey && PRESET_ROADMAPS[presetKey]) {
      const preset = PRESET_ROADMAPS[presetKey];
      return {
        title: preset.title,
        description: preset.description,
        steps: preset.steps.map((s, index) => ({
          ...s,
          id: `step-${index + 1}`,
          status: 'todo',
          notes: ''
        }))
      };
    }
    return generateDynamicMock(goal);
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    // Gemini 2.5 Flash を使用 (軽量かつ最新)
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `あなたは優秀な教育デザイナーおよびプロジェクトマネージャーです。
ユーザーの目標に対して、挫折しにくく実行しやすい、段階的で具体的な「ロードマップ」を日本語で作成してください。

目標: 「${goal}」

以下のJSONスキーマに従って、必ず有効な単一のJSON形式で出力してください。Markdownのバックチックス（\`\`\`json）などで囲まず、純粋なJSONテキストのみを返してください。

JSONスキーマ:
{
  "title": "目標に基づいたキャッチーで魅力的なロードマップタイトル (例: Web3エンジニアロードマップ v1)",
  "description": "このロードマップの概要と学習者に向けた励ましの紹介文 (2-3文程度)",
  "steps": [
    {
      "title": "ステップのタイトル (例: 1. スマートコントラクトの基礎習得)",
      "description": "このステップで学習・実行すべき具体的な内容や、推奨される行動、解決する課題について詳しく説明してください (30-80文字程度)",
      "estimatedTime": "目安時間 (例: 3日間, 1週間, 10時間)"
    }
  ]
}

条件:
- ステップ数は学習効率を考慮し、4〜7つの範囲で作成してください。
- 具体的かつ現実的なステップに分解してください。
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // レスポンスのパース
    const data = JSON.parse(responseText);
    
    // 型安全のための整形とID付与
    const steps: RoadmapStep[] = (data.steps || []).map((step: any, index: number) => ({
      id: `step-${Date.now()}-${index}`,
      title: step.title || `ステップ ${index + 1}`,
      description: step.description || '',
      estimatedTime: step.estimatedTime || '期間未定',
      status: 'todo',
      notes: ''
    }));

    return {
      title: data.title || `${goal} 達成ロードマップ`,
      description: data.description || 'AIによって自動生成されたロードマップです。',
      steps
    };
  } catch (error) {
    console.error('Gemini API Error, falling back to mock:', error);
    // API呼び出しに失敗した場合はモックデータを返す
    const presetKey = findPreset(goal);
    if (presetKey && PRESET_ROADMAPS[presetKey]) {
      const preset = PRESET_ROADMAPS[presetKey];
      return {
        title: preset.title,
        description: preset.description + " (※APIエラーのためモックデータを表示しています)",
        steps: preset.steps.map((s, index) => ({
          ...s,
          id: `step-${index + 1}`,
          status: 'todo',
          notes: ''
        }))
      };
    }
    const dynamicMock = generateDynamicMock(goal);
    dynamicMock.description += " (※APIエラーのため自動生成モックを表示しています)";
    return dynamicMock;
  }
}
