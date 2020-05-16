"""
MIT License
Copyright (c) 2020 GamingGeek

Permission is hereby granted, free of charge, to any person obtaining a copy of this software
and associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""


from discord.ext import commands
from core.config import UserConfig
import datetime
import discord
import asyncio
import functools
import traceback


class Ready(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        try:
            self.bot.load_extension("cogs.sk1erdiscord")
        except Exception:
            pass
        self.bot.logger.info("$GREEN-------------------------")
        self.bot.logger.info(f"$GREENBot: {self.bot.user}")
        self.bot.logger.info(f"$GREENID: {self.bot.user.id}")
        self.bot.logger.info(f"$GREENGuilds: {len(self.bot.guilds)}")
        self.bot.logger.info(f"$GREENUsers: {len(self.bot.users)}")
        self.bot.logger.info("$GREEN-------------------------")
        for c in self.bot.configs.values():
            if not c.loaded and hasattr(c, '_guild'):
                await c.load()  # Load any stragglers that (for whatever reason) did not load on GUILD_CREATE
        users = await self.bot.db.fetch('SELECT * FROM userconfig;')
        for u in users:
            if u['uid'] not in self.bot.configs:
                self.bot.configs[u['uid']] = UserConfig(u['uid'], bot=self.bot, db=self.bot.db)
            conf = self.bot.get_config(u['uid'])
            if not conf.loaded:
                await conf.load()
        if self.bot.get_cog('FireStatus') and not self.bot.dev:
            comps = ['gtbpmn9g33jk', 'xp3103fm3kpf']
            for c in comps:
                await asyncio.sleep(1)  # rate limits are fun
                current = await self.bot.get_cog('FireStatus').get_status(c)
                if current == 'partial_outage':
                    await asyncio.sleep(1)  # rate limits are fun 2 electric boogaloo
                    await self.bot.get_cog('FireStatus').set_status(c, 'operational')


def setup(bot):
    try:
        bot.add_cog(Ready(bot))
        bot.logger.info(f'$GREENLoaded event $CYANReady!')
    except Exception as e:
        # errortb = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        bot.logger.error(f'$REDError while loading event $CYAN"Ready"', exc_info=e)
