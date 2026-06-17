import { GoogleGenerativeAI } from '@google/generative-ai';

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  status: 'todo' | 'doing' | 'done';
  notes: string;
  deadline?: string;    // v3: "YYYY-MM-DD"
  completedAt?: string; // v4: ISO datetime when marked done
}

export interface Roadmap {
  id: string;          // v3: unique ID for multi-roadmap management
  title: string;
  description: string;
  steps: RoadmapStep[];
  createdAt: string;   // v3: creation datetime
}

// プリセットの高品質モックデータ
const PRESET_ROADMAPS: Record<string, { title: string; description: string; steps: Omit<RoadmapStep, 'id' | 'status' | 'notes' | 'deadline' | 'completedAt'>[] }> = {
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

function findPreset(query: string): string | null {
  const q = query.toLowerCase();
  if (q.includes('react') || q.includes('フロントエンド') || q.includes('javascript') || q.includes('typescript')) return 'react';
  if (q.includes('web3') || q.includes('ブロックチェーン') || q.includes('solidity') || q.includes('dapp')) return 'web3';
  if (q.includes('英語') || q.includes('英会話') || q.includes('english') || q.includes('会話')) return 'english';
  return null;
}

function generateDynamicMock(goal: string): Roadmap {
  const steps: Omit<RoadmapStep, 'id' | 'status' | 'notes' | 'deadline' | 'completedAt'>[] = [
    { title: `1. 「${goal}」の現状分析と基礎概念の理解`, description: `現状のスキルと目標のギャップを明確にし、必要な前提知識や用語をリサーチしてマップ化します。`, estimatedTime: "3日間" },
    { title: "2. 必要なツール・環境のセットアップ", description: "学習や実践をスムーズに進めるための開発環境、ツール、教材などのインフラを整え、最初の一歩を踏み出せるようにします。", estimatedTime: "2日間" },
    { title: "3. コアスキルの反復演習と小さなアウトプット", description: "インプットするだけでなく実際に手を動かし、小さなプロトタイプや演習問題を解くことで基本パターンを定着させます。", estimatedTime: "1〜2週間" },
    { title: "4. オリジナルプロジェクト・実践への適用", description: "学んだ内容を活かし、自分独自の成果物を作成・実行し、応用力を鍛えます。", estimatedTime: "2週間" },
    { title: "5. レビュー・フィードバック取得と次のステップ選定", description: "成果物を評価し課題を見つけます。不足スキルを補強し、より高度なレベルに進む計画を再設計します。", estimatedTime: "5日間" }
  ];

  return {
    id: `roadmap-${Date.now()}`,
    title: `${goal} 達成ロードマップ`,
    description: `「${goal}」を効率的に習得・達成するための、段階的かつ実践的なステップガイドです。`,
    steps: steps.map((s, i) => ({ ...s, id: `step-${i + 1}`, status: 'todo', notes: '' })),
    createdAt: new Date().toISOString()
  };
}

export async function generateRoadmapFromAI(goal: string, apiKey: string | null): Promise<Roadmap> {
  if (!apiKey || apiKey.trim() === '') {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const presetKey = findPreset(goal);
    if (presetKey && PRESET_ROADMAPS[presetKey]) {
      const preset = PRESET_ROADMAPS[presetKey];
      return {
        id: `roadmap-${Date.now()}`,
        title: preset.title,
        description: preset.description,
        steps: preset.steps.map((s, i) => ({ ...s, id: `step-${i + 1}`, status: 'todo', notes: '' })),
        createdAt: new Date().toISOString()
      };
    }
    return generateDynamicMock(goal);
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `あなたは優秀な教育デザイナーおよびプロジェクトマネージャーです。
ユーザーの目標に対して、挫折しにくく実行しやすい、段階的で具体的な「ロードマップ」を日本語で作成してください。

目標: 「${goal}」

以下のJSONスキーマに従って、必ず有効な単一のJSON形式で出力してください。Markdownのバックチックスなどで囲まず、純粋なJSONテキストのみを返してください。

JSONスキーマ:
{
  "title": "目標に基づいたキャッチーで魅力的なロードマップタイトル",
  "description": "このロードマップの概要と学習者に向けた励ましの紹介文 (2-3文程度)",
  "steps": [
    {
      "title": "ステップのタイトル",
      "description": "このステップで学習・実行すべき具体的な内容 (30-80文字程度)",
      "estimatedTime": "目安時間 (例: 3日間, 1週間, 10時間)"
    }
  ]
}

条件: ステップ数は4〜7つの範囲で、具体的かつ現実的に分解してください。`;

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text()) as { title: string; description: string; steps: { title: string; description: string; estimatedTime: string }[] };

    return {
      id: `roadmap-${Date.now()}`,
      title: data.title || `${goal} 達成ロードマップ`,
      description: data.description || 'AIによって自動生成されたロードマップです。',
      steps: (data.steps || []).map((step, i) => ({
        id: `step-${Date.now()}-${i}`,
        title: step.title || `ステップ ${i + 1}`,
        description: step.description || '',
        estimatedTime: step.estimatedTime || '期間未定',
        status: 'todo',
        notes: ''
      })),
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Gemini API Error, falling back to mock:', error);
    const presetKey = findPreset(goal);
    if (presetKey && PRESET_ROADMAPS[presetKey]) {
      const preset = PRESET_ROADMAPS[presetKey];
      return {
        id: `roadmap-${Date.now()}`,
        title: preset.title,
        description: preset.description + " (※APIエラーのためモックデータを表示しています)",
        steps: preset.steps.map((s, i) => ({ ...s, id: `step-${i + 1}`, status: 'todo', notes: '' })),
        createdAt: new Date().toISOString()
      };
    }
    const mock = generateDynamicMock(goal);
    mock.description += " (※APIエラーのため自動生成モックを表示しています)";
    return mock;
  }
}

// v2: ロードマップ生成後の継続会話
export async function chatWithAI(
  currentRoadmap: Roadmap | null,
  userMessage: string,
  apiKey: string | null
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    await new Promise(r => setTimeout(r, 700));
    return getMockChatResponse(userMessage, currentRoadmap);
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const roadmapContext = currentRoadmap
      ? `\n現在のロードマップ: 「${currentRoadmap.title}」\nステップ状況: ${currentRoadmap.steps.map(s => `${s.title}(${s.status === 'done' ? '完了' : s.status === 'doing' ? '進行中' : '未着手'})`).join(' / ')}`
      : '';

    const prompt = `あなたはロードマップ実行支援AIです。ユーザーが目標達成に向けて行動できるよう、具体的で前向きなアドバイスを日本語で150文字程度で返してください。${roadmapContext}\n\nユーザーの質問・報告: ${userMessage}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Chat API error:', error);
    return getMockChatResponse(userMessage, currentRoadmap);
  }
}

function getMockChatResponse(message: string, roadmap: Roadmap | null): string {
  const msg = message.toLowerCase();
  const doneCount = roadmap?.steps.filter(s => s.status === 'done').length ?? 0;
  const totalCount = roadmap?.steps.length ?? 0;
  const doingStep = roadmap?.steps.find(s => s.status === 'doing');
  const nextStep = roadmap?.steps.find(s => s.status === 'todo');

  if (msg.includes('難し') || msg.includes('わからない') || msg.includes('できない') || msg.includes('つらい')) {
    return `難しいと感じるのは成長の証です！まずそのステップを細かく分解してみましょう。「今日は30分だけ触ってみる」という小さな一歩から始めることをおすすめします 💪`;
  }
  if (msg.includes('進捗') || msg.includes('次') || msg.includes('どうすれば')) {
    if (doingStep) return `現在「${doingStep.title}」を進行中ですね。このステップを完了させることに集中しましょう！完了したらステータスを「完了」にチェックしてください。`;
    if (nextStep) return `次は「${nextStep.title}」に取り組みましょう。まずステータスを「進行中」にしてから始めると、モチベーションが維持しやすいですよ！`;
    if (doneCount === totalCount && totalCount > 0) return `全ステップ完了おめでとうございます！🎉 次の目標を新しいロードマップとして追加してみましょう。`;
    return `ロードマップのステップを上から順に「進行中」→「完了」と進めていきましょう！`;
  }
  if (msg.includes('モチベ') || msg.includes('やる気') || msg.includes('疲れ') || msg.includes('休')) {
    if (doneCount > 0) return `すでに${doneCount}/${totalCount}ステップも完了しています！その継続力は本物です。少し休んでから再チャレンジしましょう 🌟`;
    return `最初の一歩が一番大変です。「今日は5分だけ」という低いハードルから始めてみてください。始めたら意外と続けられますよ！`;
  }
  if (msg.includes('完了') || msg.includes('終わった') || msg.includes('できた') || msg.includes('達成')) {
    return `素晴らしい！🎉 ステップを完了にチェックして、次のステップに進みましょう。この調子で目標達成まで突き進んでください！`;
  }
  if (msg.includes('ありがとう') || msg.includes('助かっ')) {
    return `お役に立てて嬉しいです！引き続き目標達成に向けて一緒に頑張りましょう 💪 困ったことがあればいつでも聞いてください。`;
  }

  const preview = message.length > 20 ? message.slice(0, 20) + '...' : message;
  return `「${preview}」についてですね。ロードマップの各ステップを一つずつ丁寧に進めることが、目標達成への最短ルートです。行き詰まったときはいつでも相談してください！`;
}
