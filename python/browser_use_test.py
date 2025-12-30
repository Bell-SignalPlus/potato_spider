import logging

import asyncio
import argparse
import sys
import json  # 用于安全打印对象
import os

# 1️⃣ 强制重置 logging（关键）
logging.basicConfig(
    level=logging.CRITICAL,
    force=True,  # Python 3.8+，非常关键
)

# 2️⃣ 彻底关闭 logging
logging.disable(logging.CRITICAL)

# 3️⃣ 静默第三方库常见 logger
for name in [
    "browser_use",
    "browser_use.agent",
    "browser_use.browser",
    "playwright",
    "asyncio",
    "httpx",
    "websockets",
]:
    logging.getLogger(name).setLevel(logging.CRITICAL)
    logging.getLogger(name).propagate = False

import browser_use
from browser_use import Agent, Browser, ChatGoogle, ChatBrowserUse
from browser_use.agent import service


async def example(task: str):
    # 1. 确保 LD_LIBRARY_PATH 包含你的库文件
    # (建议在这里写死，这样 Python 运行时自动生效)
    libs_path = "/home/zihao/website/sys_libs/usr/lib/x86_64-linux-gnu"
    # os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "/home/zihao/website/browser/pw_browsers"
    os.environ["LD_LIBRARY_PATH"] = f"{libs_path}:{os.environ.get('LD_LIBRARY_PATH', '')}"
    browser_use.agent.service.logger.setLevel(logging.CRITICAL)

    # 初始化浏览器
    browser = Browser(
        # executable_path = '/home/zihao/website/browser/chrome-linux/chrome-linux/chrome',
        # executable_path = '/home/zihao/website/browser/pw_browsers/chromium-1200/chrome-linux64/chrome',
        cdp_url = "http://100.103.31.53:4901",
        # chromium_sandbox = False,
        # use_cloud=True,  # 可选
    )
    browser.logger.setLevel(logging.CRITICAL)

    llm = ChatGoogle('gemini-2.5-flash-lite')
#     llm = ChatBrowserUse()
    llm.logger.setLevel(logging.CRITICAL)

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
    )
    agent.logger.setLevel(logging.CRITICAL)

    history = await agent.run()
    return history

def main():
    parser = argparse.ArgumentParser(description="Process some parameters.")
    parser.add_argument('task', type=str, help='The task to perform')
    args = parser.parse_args()

    history = asyncio.run(example(args.task))
    # print(str(history))
    return history

def test_example():
    # 模拟命令行参数
    sys.argv = ['example.py', 'Visit https://www.binance.com/zh-CN/trade/DOGE_USDT?type=spot. Generate a html code to show the kline value in one minute level']

    # 使用 argparse 获取参数
    parser = argparse.ArgumentParser(description="Process some parameters.")
    parser.add_argument('task', type=str, help='The task to perform')
    args = parser.parse_args()

    # 执行异步任务
    history = asyncio.run(example(args.task))
    print(str(history))

if __name__ == "__main__":
    # 如果想用真实命令行参数
    logging.basicConfig(level=logging.CRITICAL)
    result = main()
    if (result.is_done()) :
        print(result.final_result())
    else :
        print('Execute error last time: ' +  str(result.errors()))

    # 如果想直接测试模拟命令行参数，可以注释 main()，改成：
    # test_example()
