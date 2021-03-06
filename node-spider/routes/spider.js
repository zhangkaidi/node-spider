﻿var express = require('express');
var fs = require('fs');
var cheerio = require('cheerio');
var http = require('http');
var router = express.Router();

router.get('/', function (req, res) {
    var i = 0;//默认页码；
    //var search = encodeURI('石墨烯');
    var search = req.query.words;
    var needPage = req.query.num;
    var url = "http://s.wanfangdata.com.cn/Paper.aspx?q=" + search + "&f=top&p=1";//默认url;
    start(url);//主函数，开启;
    function start(url) {
        http.get(url, function (res) {
            var html = "";
            res.setEncoding('utf-8');
            res.on('data', function (chunk) {
                html += chunk;
            })
            res.on('end', function () {
                var $ = cheerio.load(html);//当前文章html;
                var searchVal = search;//检索词
                var pageSum = $('.page_link').text().split('/')[1];//总页数
                var pageConent = "";//pageIndex:当前文章title和对应的title的索引；
                var pageIndex = "";//当前页面title对应的索引；
                var nextPageUrl = $('.pager a').last().attr('href');
                var index = nextPageUrl.lastIndexOf("=");
                var nextPageIndex = nextPageUrl.substring(index + 1, nextPageUrl.length);//下一页的nextPageIndex;
                var str = "http://s.wanfangdata.com.cn/Paper.aspx?q=" + search + "&f=top&p=" + nextPageIndex;//拼接下一页的url；
                saveHtml(pageSum, needPage, searchVal, nextPageIndex, getTitleAndPageIndex($, pageIndex, pageConent));
                goNextPage(str, needPage, pageSum);
            })
        }).on('error', function (e) {
            console.log('错误：${e.message}')
        });
    }
    function getTitleAndPageIndex($, pageIndex, pageConent) {
        $('.record-title .title').each(function () { //遍历每一页的数据，取出索引和对应文章title
            pageIndex = $(this).prevAll('.index').text();
            pageConent += pageIndex + $(this).text() + "\n";
        })
        return pageConent;
    }//每一页的title和对应的pageIndex;
    function saveHtml(pageSum, needPage, searchVal, nextPageIndex, pageConent) {
        fs.appendFile('./public/data/data.text', pageConent, 'utf-8', function (err) {
            if (err) {
                console.log(err);
            } else {
                if (i == 1) {
                    console.log('爬取开始！')
                }
                console.log('检索词：' + searchVal + ' 总共：' + pageSum + '页 实际爬取：' + needPage + '页 正在爬取：' + i + '页');
                if (pageSum == i || needPage == i) {
                    console.log('爬取结束！')
                    res.json({ result: true });
                }
            }
        });//存储在data.text中；
    }
    function goNextPage(str, needPage, pageSum) {
        i++;
        if (i < needPage && i < pageSum) {//当前页是否小于爬取页数，并且当前页小于页面的总页数
            start(str)
        }
    }//nextPage：继续下一页
});
module.exports = router;