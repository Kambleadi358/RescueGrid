#include <iostream>
#include <queue>
#include <vector>
using namespace std;
// Adjacency-list BFS and recursive DFS, O(V+E); false means a blocked edge.
void dfs(const vector<vector<pair<int,bool>>>&g,int u,vector<bool>&seen){seen[u]=true;cout<<u<<' ';for(auto [v,blocked]:g[u])if(!blocked&&!seen[v])dfs(g,v,seen);}
int main(){vector<vector<pair<int,bool>>>g(4);auto add=[&](int a,int b,bool x=false){g[a].push_back({b,x});g[b].push_back({a,x});};add(0,1);add(1,2);add(2,3);queue<int>q;q.push(0);vector<bool>s(4);s[0]=true;cout<<"BFS: ";while(!q.empty()){int u=q.front();q.pop();cout<<u<<' ';for(auto[v,b]:g[u])if(!b&&!s[v])s[v]=true,q.push(v);}cout<<"\nDFS: ";fill(s.begin(),s.end(),false);dfs(g,0,s);}
