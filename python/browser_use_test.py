import logging

import browser_use
from browser_use import Agent, Browser, ChatGoogle
import asyncio
import argparse
import sys
import json  # 用于安全打印对象
import os

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
    # 如果想用真实命令行参数调用
    result = main()
    print(result.final_result())

    # 如果想直接测试模拟命令行参数，可以注释 main()，改成：
    # test_example()
